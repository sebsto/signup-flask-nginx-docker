#!/bin/bash
echo Starting NGinx
service nginx start

echo Starting uWSGI
cd /home/docker/code
uwsgi -s /tmp/uwsgi.sock -w application:application --chown-socket=nginx:nginx

