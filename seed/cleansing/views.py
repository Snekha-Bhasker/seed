# !/usr/bin/env python
# encoding: utf-8
"""
:copyright (c) 2014 - 2016, The Regents of the University of California, through Lawrence Berkeley National Laboratory (subject to receipt of any required approvals from the U.S. Department of Energy) and contributors. All rights reserved.  # NOQA
:author
"""

# TODO The API is returning on both a POST and GET. Make sure to authenticate.

from django.http import JsonResponse
from rest_framework import viewsets

from seed.cleansing.models import CleansingInstance
from rest_framework.authentication import SessionAuthentication
from seed.authentication import SEEDAuthentication


# TODO: Who owns the cleansing operation once it is started?  Organization level?  Single user?
class CleansingOperationViews(viewsets.ViewSet):
    """
Handles Data Quality API operations within Inventory backend.
(1) Post, wait, get…
(2) Respond with what changed
    """
    authentication_classes = (SessionAuthentication, SEEDAuthentication)

    def create(self, request):
        """
        This API endpoint will create a new cleansing operation process in the background,
        on potentially a subset of properties/taxlots, and return back a query key
        """
        # step 1: kick off a background task
        task = None  # = celery.blahblah(with parameters)
        # step 2: create a new model instance
        ci = CleansingInstance.create(task)  # actually just assign org and some background_task_identifier
        ci.save()
        return JsonResponse({'cleansing_pk': ci.pk})

    def retrieve(self, request, pk=None):
        """
        This API endpoint will take the pk (can we use a different ID?) and, assuming this user has access
        to this cleansing operation, returns back a status update
        """
        # step 1: filter all cleansing instances to those owned by this users organization
        owned_cleansing = CleansingInstance.objects.filter(org=request.user.org_id)
        # step 2: check if this pk is in the list
        try:
            ci = owned_cleansing.get(pk=pk)
        except CleansingInstance.DoesNotExist:
            return JsonResponse({'status': 'bad'})
        # step 3: check celery for the status of the background task
        status = ci  # = celery.checkstatus(ci.background_task_identifier)
        return JsonResponse({'status': status})
