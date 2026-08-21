pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Harshavardhana-v/devops-task-manager.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t devops-task-manager .'
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
                        echo Jenkins account:
                        whoami

                        echo Fixing key permissions...

                        icacls "%KEYFILE%" /inheritance:r
                        icacls "%KEYFILE%" /remove "BUILTIN\\Users"
                        icacls "%KEYFILE%" /grant:r "*S-1-5-18:F"

                        echo Deploying to EC2...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu13.201.222.207 "sudo docker stop devops-task-manager || true && sudo docker rm devops-task-manager || true"

                        echo Copying application to EC2...

                        scp -i "%KEYFILE%" -o StrictHostKeyChecking=no -r . ubuntu@13.201.222.207:/home/ubuntu/devops-task-manager

                        echo Building Docker image on EC2...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker build -t devops-task-manager ."
                        echo Starting container...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker run -d --name devops-task-manager -p 80:80 devops-task-manager"

                        echo Deployment completed!
                    '''
                }
            }
        }
    }
}