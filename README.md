# Signup Demo Application

This application uses Python's Flask framework, NGINX and uWSGI daemon

This Python sample application is based on the [eb-py-flask-signup](https://github.com/awslabs/eb-py-flask-signup) sample. It has been modified to run on Amazon EC2 Container Service (ECS).

## Local run 

To run / debug locally from your laptop 

pipenv shell
python3 application.py 

## Docker build & run 

To run on a docuker container on your lapptop 

```bash
docker build -t demo-flask-signup:latest .
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
docker run -p 8080:80 --rm --env AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --env AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY demo-flask-signup:latest
```

## Push the image to ECR 

```bash
$(aws ecr get-login --no-include-email --region us-west-2)
docker build -t demo-flask-signup .
docker tag demo-flask-signup:latest 486652066693.dkr.ecr.us-west-2.amazonaws.com/demo-flask-signup:latest
docker push 486652066693.dkr.ecr.us-west-2.amazonaws.com/demo-flask-signup:latest
```

## Create the ECS cluster 

```bash
cd cdk-ecs-cluster 
npm install # first time only
npm run build && cdk deploy 
```

Take note of Cluster ID & Service ID, report back to cdk-ecs-pipeline/lib/cdk-ecs-pipeline.ts 

## Create the CI/CD Pipeline

NOT WORKING !
