pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO   = '351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager'

        // IMPORTANT: double quotes so BUILD_NUMBER is evaluated
        IMAGE_TAG  = "build-${BUILD_NUMBER}"
    }

    stages {

        // ============================================================
        // CHECKOUT
        // ============================================================

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Harshavardhana-v/devops-task-manager.git'
            }
        }


        // ============================================================
        // TERRAFORM PLAN
        // ============================================================

        stage('Terraform Plan') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'jenkins-ecr',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {

                    bat '''

                        echo ================================
                        echo Terraform Init
                        echo ================================

                        cd /d C:\\Terraform\\devops-infra

                        terraform init

                        if errorlevel 1 (
                            echo TERRAFORM INIT FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Terraform Plan
                        echo ================================

                        terraform plan

                        if errorlevel 1 (
                            echo TERRAFORM PLAN FAILED
                            exit /b 1
                        )

                        echo TERRAFORM PLAN SUCCESSFUL

                    '''
                }
            }
        }


        // ============================================================
        // BUILD DOCKER IMAGE
        // ============================================================

        stage('Build Docker Image') {

            steps {

                bat '''

                    echo ================================
                    echo Building Docker Image
                    echo ================================

                    echo Image Tag: %IMAGE_TAG%

                    docker build --provenance=false --sbom=false -t %ECR_REPO%:%IMAGE_TAG% .

                    if errorlevel 1 (
                        echo DOCKER BUILD FAILED
                        exit /b 1
                    )

                    echo DOCKER BUILD SUCCESSFUL

                '''
            }
        }


        // ============================================================
        // PUSH IMAGE TO ECR
        // ============================================================

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

                        echo ================================
                        echo Logging into AWS ECR
                        echo ================================

                        aws configure set aws_access_key_id "%AWS_ACCESS_KEY_ID%"
                        aws configure set aws_secret_access_key "%AWS_SECRET_ACCESS_KEY%"
                        aws configure set region "%AWS_REGION%"

                        aws ecr get-login-password --region "%AWS_REGION%" | docker login --username AWS --password-stdin "%ECR_REPO%"

                        if errorlevel 1 (
                            echo ECR LOGIN FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Pushing Docker Image
                        echo ================================

                        echo Image Tag: %IMAGE_TAG%

                        docker push "%ECR_REPO%:%IMAGE_TAG%"

                        if errorlevel 1 (
                            echo ECR PUSH FAILED
                            exit /b 1
                        )

                        echo ECR PUSH SUCCESSFUL

                    '''
                }
            }
        }


        // ============================================================
        // ENSURE EC2 IS RUNNING
        // ============================================================

        stage('Ensure EC2 Running') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'jenkins-ecr',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {

                    powershell '''

                        $env:AWS_ACCESS_KEY_ID = $env:AWS_ACCESS_KEY_ID
                        $env:AWS_SECRET_ACCESS_KEY = $env:AWS_SECRET_ACCESS_KEY
                        $env:AWS_DEFAULT_REGION = $env:AWS_REGION

                        Write-Host "================================"
                        Write-Host "Checking EC2 status"
                        Write-Host "================================"

                        $EC2_ID = aws ec2 describe-instances `
                            --filters "Name=tag:Name,Values=terraform-devops-server" `
                                      "Name=instance-state-name,Values=stopped,running" `
                            --query "Reservations[0].Instances[0].InstanceId" `
                            --output text

                        Write-Host "EC2 Instance ID: $EC2_ID"

                        if ([string]::IsNullOrWhiteSpace($EC2_ID) -or $EC2_ID -eq "None") {
                            Write-Host "EC2 INSTANCE NOT FOUND"
                            exit 1
                        }

                        $EC2_STATE = aws ec2 describe-instances `
                            --instance-ids $EC2_ID `
                            --query "Reservations[0].Instances[0].State.Name" `
                            --output text

                        Write-Host "EC2 State: $EC2_STATE"

                        if ($EC2_STATE -eq "stopped") {

                            Write-Host "EC2 is stopped. Starting instance..."

                            aws ec2 start-instances `
                                --instance-ids $EC2_ID

                            if ($LASTEXITCODE -ne 0) {
                                Write-Host "FAILED TO START EC2"
                                exit 1
                            }

                            Write-Host "Waiting for EC2 to become running..."

                            aws ec2 wait instance-running `
                                --instance-ids $EC2_ID

                            if ($LASTEXITCODE -ne 0) {
                                Write-Host "FAILED WHILE WAITING FOR EC2"
                                exit 1
                            }
                        }

                        Write-Host "EC2 IS RUNNING"

                    '''
                }
            }
        }


        // ============================================================
        // GET EC2 ELASTIC IP
        // ============================================================

        stage('Get EC2 IP') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'jenkins-ecr',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {

                    script {

                        env.EC2_IP = bat(
                            script: '''

                                @set AWS_DEFAULT_REGION=%AWS_REGION%
                                @set AWS_REGION=%AWS_REGION%
                                @set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                                @set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%

                                @cd /d C:\\Terraform\\devops-infra

                                @terraform output -raw ec2_elastic_ip

                            ''',
                            returnStdout: true
                        ).trim()

                        echo "EC2 Elastic IP: ${env.EC2_IP}"

                        if (!env.EC2_IP || env.EC2_IP == 'null') {
                            error("Failed to obtain EC2 Elastic IP from Terraform")
                        }
                    }
                }
            }
        }


        // ============================================================
        // DEPLOY TO AWS EC2
        // ============================================================

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
                        echo EC2 Information
                        echo ================================

                        echo Deploying to EC2 IP: %EC2_IP%
                        echo Image: %ECR_REPO%:%IMAGE_TAG%


                        echo ================================
                        echo Testing EC2 Connection
                        echo ================================

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@%EC2_IP% "echo EC2 CONNECTION SUCCESSFUL"

                        if errorlevel 1 (
                            echo EC2 SSH CONNECTION FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Logging into ECR on EC2
                        echo ================================

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@%EC2_IP% "aws ecr get-login-password --region %AWS_REGION% | sudo docker login --username AWS --password-stdin 351395891043.dkr.ecr.ap-south-1.amazonaws.com"

                        if errorlevel 1 (
                            echo EC2 ECR LOGIN FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Removing Old Container
                        echo ================================

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@%EC2_IP% "sudo docker rm -f devops-task-manager || true"


                        echo ================================
                        echo Pulling Versioned Image
                        echo ================================

                        echo Pulling:
                        echo %ECR_REPO%:%IMAGE_TAG%

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@%EC2_IP% "sudo docker pull %ECR_REPO%:%IMAGE_TAG%"

                        if errorlevel 1 (
                            echo DOCKER PULL FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Starting New Container
                        echo ================================

                        ssh -i "%KEYFILE%" -o StrictHostKeyChecking=no ubuntu@%EC2_IP% "sudo docker run -d --restart unless-stopped --name devops-task-manager -p 80:80 %ECR_REPO%:%IMAGE_TAG%"

                        if errorlevel 1 (
                            echo DOCKER RUN FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo DEPLOYMENT SUCCESSFUL
                        echo ================================

                        echo Deployed Image:
                        echo %ECR_REPO%:%IMAGE_TAG%

                    '''
                }
            }
        }
    }
}