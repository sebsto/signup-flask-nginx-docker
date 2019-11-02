## NOT USED ANYMORE - REPLACED BY CODE*

#!/bin/bash
SERVICE_NAME="flask-signup"
#VERSION=`date +%y%m%d%H%M%S`"_"${BUILD_NUMBER}
VERSION=${BUILD_NUMBER}
TASK_FAMILY="flask-signup"

# Create a new task definition for this build
TASK_FILE=flask-signup-v$VERSION.json
sed -e "s;%BUILD_NUMBER%;$VERSION;g" $HOME/flask-signup.json > $TASK_FILE
aws ecs register-task-definition --family flask-signup --cli-input-json file://$TASK_FILE

# Update the service with the new task definition and desired count
TASK_REVISION=$(aws ecs describe-task-definition --task-definition flask-signup --query "taskDefinition.revision" --output text)
DESIRED_COUNT=$(aws ecs describe-services --services ${SERVICE_NAME} --query "services[].desiredCount" --output text)
if [ ${DESIRED_COUNT} = "0" ]; then
    DESIRED_COUNT="1"
else
	#stop existing tasks
    TASKS=$(aws ecs list-tasks --output text --query taskArns)
    echo Stopping old tasks : $TASKS
    for T in $TASKS; do aws ecs stop-task --task $T; done
fi

aws ecs update-service --cluster default --service ${SERVICE_NAME} --task-definition ${TASK_FAMILY}:${TASK_REVISION} --desired-count ${DESIRED_COUNT}

