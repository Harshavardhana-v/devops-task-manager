pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO = '351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager'
        EC2_IP= ''
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

      stage('Get EC2 IP') {
    steps {
        script {
            EC2_IP = bat(
                script: '@cd /d C:\\Terraform\\devops-infra && @terraform output -raw ec2_elastic_ip',
                returnStdout: true
            ).trim()

            echo "EC2 Elastic IP: ${EC2_IP}"
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
                echo ================================
                echo Preparing SSH key
                echo ================================

                whoami

                icacls "%KEYFILE%" /inheritance:r
                icacls "%KEYFILE%" /remove "BUILTIN\\Users"
                icacls "%KEYFILE%" /grant:r "*S-1-5-18:F"

                echo ================================
                echo Testing EC2 connection
                echo ================================

                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "echo EC2 CONNECTION SUCCESSFUL"

                if errorlevel 1 (
                    echo EC2 SSH CONNECTION FAILED
                    exit /b 1
                )

                echo ================================
                echo Logging into ECR on EC2
                echo ================================

                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 351395891043.dkr.ecr.ap-south-1.amazonaws.com"

                if errorlevel 1 (
                    echo EC2 ECR LOGIN FAILED
                    exit /b 1
                )

                echo ================================
                echo Removing old container
                echo ================================

                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "sudo docker rm -f devops-task-manager || true"

                echo ================================
                echo Pulling latest image
                echo ================================

                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "sudo docker pull 351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager:latest"

                if errorlevel 1 (
                    echo DOCKER PULL FAILED
                    exit /b 1
                )

                echo ================================
                echo Starting new container
                echo ================================

                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "sudo docker run -d --restart unless-stopped --name devops-task-manager -p 80:80 351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager:latest"
                if errorlevel 1 (
                    echo DOCKER RUN FAILED
                    exit /b 1
                )

                echo ================================
                echo DEPLOYMENT SUCCESSFUL
                echo ================================
            '''
        }
    }
}
    }
}