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

                    bat """
                        echo Jenkins account:
                        whoami

                        echo Fixing SSH key permissions...

                        icacls "%KEYFILE%" /inheritance:r
                        icacls "%KEYFILE%" /remove "BUILTIN\\Users"
                        icacls "%KEYFILE%" /grant:r "*S-1-5-18:F"

                        echo Testing EC2 connection...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "echo EC2 CONNECTION SUCCESSFUL"

                        if errorlevel 1 (
                            echo EC2 SSH CONNECTION FAILED
                            exit /b 1
                        )

                        echo Creating project directory...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "mkdir -p /home/ubuntu/devops-task-manager"

                        if errorlevel 1 (
                            echo DIRECTORY CREATION FAILED
                            exit /b 1
                        )

                        echo Copying application files...

                        scp -i "%KEYFILE%" -o StrictHostKeyChecking=no Dockerfile docker-compose.yml index.html script.js style.css ubuntu@13.201.222.207:/home/ubuntu/devops-task-manager/

                        if errorlevel 1 (
                            echo FILE COPY FAILED
                            exit /b 1
                        )

                        echo Stopping old Compose application...

ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose down || true"

echo Removing old container...

ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "sudo docker rm -f devops-task-manager || true"

echo Building and starting application...

ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose up -d --build"


                        if errorlevel 1 (
                            echo DOCKER COMPOSE DOWN FAILED
                            exit /b 1
                        )

                        echo Building and starting application...

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@13.201.222.207 "cd /home/ubuntu/devops-task-manager && sudo docker compose up -d --build"

                        if errorlevel 1 (
                            echo DOCKER COMPOSE DEPLOYMENT FAILED
                            exit /b 1
                        )

                        echo Deployment completed successfully!
                    """
                }
            }
        }
    }
}