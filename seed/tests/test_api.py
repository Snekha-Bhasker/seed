# !/usr/bin/env python
# encoding: utf-8
"""
:copyright (c) 2014 - 2016, The Regents of the University of California, through Lawrence Berkeley National Laboratory (subject to receipt of any required approvals from the U.S. Department of Energy) and contributors. All rights reserved.  # NOQA
:author
"""
import json
import os
import time
from unittest import skip

from django.core.urlresolvers import reverse_lazy, reverse
from django.test import TestCase

from seed.factory import SEEDFactory
from seed.landing.models import SEEDUser as User
from seed.lib.superperms.orgs.models import Organization, OrganizationUser
from seed.models import CanonicalBuilding
from seed.utils.api import get_api_endpoints


class ApiAuthenticationTests(TestCase):
    """
    Tests of various ways of authenticating to the API.

    Uses the get_building endpoint in all cases.
    """

    def setUp(self):
        user_details = {
            'username': 'test_user@demo.com',
            'password': 'test_pass',
            'email': 'test_user@demo.com'
        }
        self.user = User.objects.create_user(**user_details)
        self.user.generate_key()
        self.org = Organization.objects.create()
        OrganizationUser.objects.create(user=self.user, organization=self.org)

        cb = CanonicalBuilding(active=True)
        cb.save()
        b = SEEDFactory.building_snapshot(canonical_building=cb,
                                          property_name='ADMIN BUILDING',
                                          address_line_1='100 Admin St')
        cb.canonical_snapshot = b
        cb.save()
        b.super_organization = self.org
        b.save()
        self.building = b

        self.api_url = reverse_lazy('seed:get_building')
        self.params = {
            'building_id': cb.pk,
            'organization_id': self.org.pk,
        }
        self.auth_string = '%s:%s' % (self.user.username, self.user.api_key)

    # TODO replace with test for inventory report
    @skip("Fix for new data model")
    def test_get(self):
        """
        Test auth via GET parameter.
        """
        headers = {'HTTP_AUTHORIZATION': self.auth_string}
        resp = self.client.get(self.api_url, data=self.params, **headers)
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content)
        self.assertEqual(body['status'], 'success')
        self.assertEqual(body['building']['address_line_1'],
                         self.building.address_line_1)

    # TODO replace with test for inventory report
    @skip("Fix for new data model")
    def test_no_auth(self):
        """
        Test forgetting to provide API key in any form.
        """
        resp = self.client.get(self.api_url, data=self.params)
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.content, '')


class SchemaGenerationTests(TestCase):

    def test_get_api_endpoints_utils(self):
        """
        Test of function that traverses all URLs looking for api endpoints.
        """
        res = get_api_endpoints()
        for url, fn in res.items():
            self.assertTrue(fn.is_api_endpoint)
            self.assertTrue(url.startswith('/'))
            self.assertTrue(url.endswith('/'),
                            "Endpoint %s doesn't end with / as expected" % url)

    def test_get_api_schema(self):
        """
        Test of 'schema' generator.
        """
        url = reverse('api:get_api_schema')
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        endpoints = json.loads(res.content)

        # the url we just hit should be in here
        self.assertTrue(url in endpoints)
        endpoint = endpoints[url]
        self.assertEqual(endpoint['name'], 'get_api_schema')
        self.assertTrue('description' in endpoint)


class TestApi(TestCase):

    def setUp(self):
        user_details = {
            'username': 'test_user@demo.com',  # the username needs to be in the form of an email.
            'password': 'test_pass',
            'email': 'test_user@demo.com',
            'first_name': 'Jaqen',
            'last_name': 'H\'ghar'
        }
        self.user = User.objects.create_user(**user_details)
        self.user.generate_key()
        self.org = Organization.objects.create()
        OrganizationUser.objects.create(user=self.user, organization=self.org)

        self.headers = {'HTTP_AUTHORIZATION': '%s:%s' % (self.user.username, self.user.api_key)}

    def get_org_id(self, dict, username):
        '''Return the org id from the passed dictionary and username'''
        id = None
        for ctr in range(len(dict['organizations'])):
            if dict['organizations'][ctr]['owners'][0]['email'] == username:
                id = dict['organizations'][ctr]['org_id']
                break

        return id

    def test_user_profile(self):
        # test logging in with the password, the remaining versions will use the HTTP Authentication
        self.client.login(username='test_user@demo.com', password='test_pass')
        r = self.client.get('/api/v2/users/' + str(self.user.pk) + '/', follow=True)
        self.assertEqual(r.status_code, 200)

        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['first_name'], 'Jaqen')
        self.assertEqual(r['last_name'], 'H\'ghar')
        self.client.logout()

    def test_with_http_authorization(self):
        r = self.client.get('/api/v2/users/' + str(self.user.pk) + '/', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertNotEqual(r, None)

    def test_organization(self):
        self.client.login(username='test_user@demo.com', password='test_pass')
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)

        # {
        # "organizations": [
        #   { "sub_orgs": [], "num_buildings": 0, "owners": [{...}],
        #     "number_of_users": 1, "name": "", "user_role": "owner", "is_parent": true, "org_id": 1, "id": 1,
        #     "user_is_owner": true}
        #   ]
        # }
        r = json.loads(r.content)
        self.assertEqual(len(r['organizations']), 1)
        self.assertEqual(len(r['organizations'][0]['sub_orgs']), 0)
        self.assertEqual(r['organizations'][0]['num_buildings'], 0)
        self.assertEqual(len(r['organizations'][0]['owners']), 1)
        self.assertEqual(r['organizations'][0]['number_of_users'], 1)
        self.assertEqual(r['organizations'][0]['user_role'], 'owner')
        self.assertEqual(r['organizations'][0]['owners'][0]['first_name'], 'Jaqen')
        self.assertEqual(r['organizations'][0]['num_buildings'], 0)

    def test_organization_details(self):
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        r = json.loads(r.content)
        organization_id = self.get_org_id(r, self.user.username)

        # get details on the organization
        r = self.client.get('/api/v2/organizations/' + str(organization_id) + '/', follow=True,
                            **self.headers)
        self.assertEqual(r.status_code, 200)

        # {
        #     "status": "success",
        #     "organization": {
        #         "sub_orgs": [],
        #         "num_buildings": 0,
        #         "owners": [
        #             {
        #                 "first_name": "Jaqen",
        #                 "last_name": "H'ghar",
        #                 "email": "test_user@demo.com",
        #                 "id": 2
        #             }
        #         ],
        #         "number_of_users": 1,
        #         "name": "",
        #         "user_role": "owner",
        #         "is_parent": true,
        #         "org_id": 2,
        #         "id": 2,
        #         "user_is_owner": true
        #     }
        # }

        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['organization']['num_buildings'], 0)
        self.assertEqual(r['organization']['number_of_users'], 1)
        self.assertEqual(len(r['organization']['owners']), 1)
        self.assertEqual(r['organization']['user_is_owner'], True)

    def test_update_user(self):
        user_payload = {
            'first_name': 'Arya',
            'last_name': 'Stark',
            'email': self.user.username
        }
        r = self.client.put('/api/v2/users/%s/' % self.user.pk, data=json.dumps(user_payload),
                             content_type='application/json', **self.headers)

        # re-retrieve the user profile
        r = self.client.get('/api/v2/users/' + str(self.user.pk) + '/', follow=True, **self.headers)
        r = json.loads(r.content)

        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['first_name'], 'Arya')
        self.assertEqual(r['last_name'], 'Stark')

    def test_adding_user(self):
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        r = json.loads(r.content)
        organization_id = self.get_org_id(r, self.user.username)
        new_user = {
            'organization_id': organization_id,
            'first_name': 'Brienne',
            'last_name': 'Tarth',
            'email': 'test+1@demo.com',
            'role': 'member'
        }

        r = self.client.post('/api/v2/users/', data=json.dumps(new_user), content_type='application/json',
                             **self.headers)
        self.assertEqual(r.status_code, 200)

        r = self.client.get('/api/v2/organizations/%s/' % organization_id, follow=True,
                            **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertEqual(r['organization']['number_of_users'], 2)

        # get org users
        r = self.client.post('/api/v2/organizations/%s/users/' % organization_id,
                             content_type='application/json', **self.headers)
        self.assertEqual(r.status_code, 200)
        # {
        #     "status": "success",
        #     "users": [
        #         {
        #             "role": "owner",
        #             "first_name": "Jaqen",
        #             "last_name": "H'ghar",
        #             "user_id": 1,
        #             "email": "test_user@demo.com"
        #         },
        #         {
        #             "role": "member",
        #             "first_name": "Brienne",
        #             "last_name": "Tarth",
        #             "user_id": 2,
        #             "email": "test+1@demo.com"
        #         }
        #     ]
        # }

        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertEqual(len(r['users']), 2)

        # get the user id of the new user
        user_id = [i for i in r['users'] if i['last_name'] == 'Tarth'][0]['user_id']

        # Change the user role
        payload = {
            'organization_id': organization_id,
            'role': 'owner'
        }

        r = self.client.post('/api/v2/users/%s/update_role/' % user_id, data=json.dumps(payload), content_type='application/json',
                             **self.headers)

        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')

        r = self.client.post('/api/v2/organizations/%s/users/' % organization_id,
                             content_type='application/json', **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        new_user = [i for i in r['users'] if i['last_name'] == 'Tarth'][0]
        self.assertEqual(new_user['role'], 'owner')

    def test_get_query_threshold(self):
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        r = json.loads(r.content)
        organization_id = self.get_org_id(r, self.user.username)

        r = self.client.get("/api/v2/organizations/%s/query_threshold/" % organization_id, follow=True,
                            **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['query_threshold'], None)

    def test_shared_fields(self):
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        r = json.loads(r.content)
        organization_id = self.get_org_id(r, self.user.username)

        r = self.client.get("/api/v2/organizations/%s/shared_fields/" % organization_id, follow=True,
                            **self.headers)

        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['public_fields'], [])
        self.assertEqual(r['shared_fields'], [])

    def test_upload_buildings_file(self):
        r = self.client.get('/api/v2/organizations/', follow=True, **self.headers)
        r = json.loads(r.content)
        organization_id = self.get_org_id(r, self.user.username)

        raw_building_file = os.path.relpath(os.path.join('seed/tests/data', 'covered-buildings-sample.csv'))
        self.assertTrue(os.path.isfile(raw_building_file), 'could not find file')

        payload = {'organization_id': organization_id, 'name': 'API Test'}

        # create the data set
        r = self.client.post('/api/v2/datasets/', data=json.dumps(payload), content_type='application/json',
                             **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')

        data_set_id = r['id']

        # retrieve the upload details
        upload_details = self.client.get('/data/get_upload_details/', follow=True, **self.headers)
        self.assertEqual(upload_details.status_code, 200)
        upload_details = json.loads(upload_details.content)
        self.assertEqual(upload_details['upload_mode'], 'filesystem')

        # create hash for /data/upload/
        fsysparams = {
            'qqfile': raw_building_file,
            'import_record': data_set_id,
            'source_type': 'Assessed Raw',
            'filename': open(raw_building_file, 'rb')
        }

        # upload data and check response
        r = self.client.post(upload_details['upload_path'], fsysparams, follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)

        r = json.loads(r.content)
        self.assertEqual(r['success'], True)
        import_file_id = r['import_file_id']
        self.assertNotEqual(import_file_id, None)

        # Save the data to BuildingSnapshots
        payload = {
            'file_id': import_file_id,
            'organization_id': organization_id
        }
        r = self.client.post('/app/save_raw_data/', data=json.dumps(payload), content_type='application/json',
                             follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)

        # {
        #     "status": "success",
        #     "progress_key": ":1:SEED:save_raw_data:PROG:1"
        # }
        r = json.loads(r.content)
        self.assertEqual(r['status'], 'success')
        self.assertNotEqual(r['progress_key'], None)
        time.sleep(15)

        # check the progress bar
        progress_key = r['progress_key']
        r = self.client.post('/app/progress/', data=json.dumps({'progress_key': progress_key}),
                             content_type='application/json', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)

        r = json.loads(r.content)
        # {
        #   "status": "success",
        #   "progress": 100,
        #   "progress_key": ":1:SEED:save_raw_data:PROG:1"
        # }
        self.assertEqual(r['status'], 'success')
        self.assertEqual(r['progress'], 100)

        # Save the column mappings.
        payload = {
            'import_file_id': import_file_id,
            'organization_id': organization_id
        }
        payload['mappings'] = [[u'city', u'City'],
                               [u'postal_code', u'Zip'],
                               [u'gross_floor_area', u'GBA'],
                               [u'building_count', u'BLDGS'],
                               [u'tax_lot_id', u'UBI'],
                               [u'state_province', u'State'],
                               [u'address_line_1', u'Address'],
                               [u'owner', u'Owner'],
                               [u'use_description', u'Property Type'],
                               [u'year_built', u'AYB_YearBuilt']]
        r = self.client.post('/app/save_column_mappings/', data=json.dumps(payload),
                             content_type='application/json', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)

        # {
        #   "status": "success"
        # }
        self.assertEqual(r['status'], 'success')

        # Map the buildings with new column mappings.
        payload = {
            'file_id': import_file_id,
            'organization_id': organization_id
        }
        r = self.client.post('/app/remap_buildings/', data=json.dumps(payload),
                             content_type='application/json', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)
        r = json.loads(r.content)

        # {
        #     "status": "success",
        #     "progress_key": ":1:SEED:map_data:PROG:1"
        # }

        self.assertEqual(r['status'], 'success')
        self.assertNotEqual(r['progress_key'], None)

        # time.sleep(10)
        # TODO: create a loop to check the progress. stop when status is success

        # check the progress bar
        progress_key = r['progress_key']
        r = self.client.post('/app/progress/', data=json.dumps({'progress_key': progress_key}),
                             content_type='application/json', follow=True, **self.headers)
        self.assertEqual(r.status_code, 200)

        r = json.loads(r.content)
        # {
        #   "status": "success",
        #   "progress": 100,
        #   "progress_key": ":1:SEED:map_data:PROG:1"
        # }

        # self.assertEqual(r['status'], 'success')
        # self.assertEqual(r['progress'], 100)

        # # Get the mapping suggestions
        r = self.client.post(
            '/api/v2/data_files/{}/mapping_suggestions/?organization_id={}'.format(import_file_id, organization_id),
            content_type='application/json',
            follow=True,
            **self.headers
        )
