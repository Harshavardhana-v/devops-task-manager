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

            bat """
                echo Deploying to EC2...

                echo Creating project directory...
                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "mkdir -p /home/ubuntu/devops-task-manager"

                echo Copying application files...
                scp -i "%KEYFILE%" -o StrictHostKeyChecking=no Dockerfile docker-compose.yml index.html script.js style.css ubuntu@13.201.222.207:/home/ubuntu/devops-task-manager/

                echo Stopping old Compose application...
                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose down || true"

                echo Building and starting application...
                ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose up -d --build"

                echo Deployment completed!
            """
        }
    }
      }
    }
}