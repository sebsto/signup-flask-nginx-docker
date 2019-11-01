# Copyright 2014 Josh 'blacktop' Maine
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM nginx

RUN apt-get update
RUN apt-get install -y --no-install-recommends build-essential python3 python3-setuptools python3-pip python3-dev  
RUN pip3 install pipenv 

# install our code
ADD . /home/docker/code/

# Configure Nginx
RUN ln -s /home/docker/code/nginx-app.conf /etc/nginx/conf.d/
RUN mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.ORIGINAL

# Install application requirements
RUN (cd /home/docker/code && pipenv install)

# Start uWSGI daemon
EXPOSE 80 
CMD cd /home/docker/code && pipenv run ./start.sh

