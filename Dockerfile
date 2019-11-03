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

