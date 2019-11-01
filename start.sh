#!/bin/bash
echo Starting NGinx
service nginx start

echo Starting uWSGI
cd /home/docker/code
uwsgi -s /tmp/uwsgi.sock --manage-script-name --mount /=application:application --chown-socket=nginx:nginx
