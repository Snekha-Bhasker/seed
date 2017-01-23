# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2017-01-23 19:13
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data_importer', '0009_importfile_uploaded_filename'),
        ('seed', '0047_auto_20170119_1318'),
    ]

    operations = [
        migrations.AddField(
            model_name='column',
            name='import_file',
            field=models.ManyToManyField(blank=True, to='data_importer.ImportFile'),
        ),
        migrations.AddField(
            model_name='columnmapping',
            name='import_file',
            field=models.ManyToManyField(blank=True, to='data_importer.ImportFile'),
        ),
    ]
