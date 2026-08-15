pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Harshavardhana-v/devops-task-manager.git'
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

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.232.32.62 "cd /home/ubuntu/devops-task-manager && git pull origin main && sudo docker build -t devops-task-manager . && sudo docker stop devops-task-manager || true && sudo docker rm devops-task-manager || true && sudo docker run -d --name devops-task-manager -p 80:80 devops-task-manager"
                    '''
                }
            }
        }
    }
}