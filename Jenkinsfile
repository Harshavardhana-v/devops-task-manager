pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO = '351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Harshavardhana-v/devops-task-manager.git'
            }
        }

        stage('Build Docker Image') {
            steps {
               bat 'docker build --provenance=false --sbom=false -t %ECR_REPO%:latest .'
            }
        }

        stage('Push Image to ECR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'jenkins-ecr',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {

                    bat '''
                        echo Logging into AWS ECR...

                        aws configure set aws_access_key_id "%AWS_ACCESS_KEY_ID%"
                        aws configure set aws_secret_access_key "%AWS_SECRET_ACCESS_KEY%"
                        aws configure set region "%AWS_REGION%"

                        aws ecr get-login-password --region "%AWS_REGION%" | docker login --username AWS --password-stdin "%ECR_REPO%"

                        if errorlevel 1 (
                            echo ECR LOGIN FAILED
                            exit /b 1
                        )

                        echo Pushing Docker image to ECR...

                        docker push "%ECR_REPO%:latest"

                        if errorlevel 1 (
                            echo ECR PUSH FAILED
                            exit /b 1
                        )

                        echo ECR PUSH SUCCESSFUL
                    '''
                }
            }
        }

        stage('Deploy to AWS EC2') {
            steps {

                withCredentials([
                    file(
                        credentialsId: 'aws-ec2-pem',
                        variable: 'KEYFILE'
                    )
                ]) {

                    bat '''
                        echo Deploying to EC2...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose down || true"

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker rm -f devops-task-manager || true"

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker pull %ECR_REPO%:latest"

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker tag %ECR_REPO%:latest devops-task-manager:latest"

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker run -d --name devops-task-manager -p 80:80 devops-task-manager:latest"

                        echo Deployment completed!
                    '''
                }
            }
        }
    }
}