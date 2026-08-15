pipeline {

    agent any

    environment {
        IMAGE_NAME = 'harshavardhana07/devops-task-manager:latest'
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
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    bat '''
                        echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
                        docker push %IMAGE_NAME%
                        docker logout
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
                        icacls "%KEYFILE%" /inheritance:r
                        icacls "%KEYFILE%" /remove "BUILTIN\\Users"
                        icacls "%KEYFILE%" /grant:r "*S-1-5-18:F"

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.232.32.62 "sudo docker pull %IMAGE_NAME% && sudo docker stop devops-task-manager || true && sudo docker rm devops-task-manager || true && sudo docker run -d --name devops-task-manager -p 80:80 %IMAGE_NAME%"
                    '''
                }
            }
        }
    }
}