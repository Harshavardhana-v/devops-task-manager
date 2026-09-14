pipeline {

    agent any

    environment {

        AWS_REGION = 'ap-south-1'

        // Web / Nginx image
        ECR_REPO = '351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager'

        // Backend image
        BACKEND_ECR_REPO = '351395891043.dkr.ecr.ap-south-1.amazonaws.com/devops-task-manager-backend'

        // Jenkins build-specific image tag
        IMAGE_TAG = "build-${BUILD_NUMBER}"
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
        // BUILD WEB IMAGE
        // ============================================================

        stage('Build Web Docker Image') {

            steps {

                bat '''

                    echo ================================
                    echo Building Web Docker Image
                    echo ================================

                    echo Repository:
                    echo %ECR_REPO%

                    echo Image Tag:
                    echo %IMAGE_TAG%


                    docker build --provenance=false --sbom=false ^
                        -t %ECR_REPO%:%IMAGE_TAG% .


                    if errorlevel 1 (
                        echo WEB DOCKER BUILD FAILED
                        exit /b 1
                    )


                    echo WEB DOCKER BUILD SUCCESSFUL

                '''
            }
        }


        // ============================================================
        // BUILD BACKEND IMAGE
        // ============================================================

        stage('Build Backend Docker Image') {

            steps {

                bat '''

                    echo ================================
                    echo Building Backend Docker Image
                    echo ================================

                    echo Repository:
                    echo %BACKEND_ECR_REPO%

                    echo Image Tag:
                    echo %IMAGE_TAG%


                    docker build --provenance=false --sbom=false ^
                        -t %BACKEND_ECR_REPO%:%IMAGE_TAG% ./backend


                    if errorlevel 1 (
                        echo BACKEND DOCKER BUILD FAILED
                        exit /b 1
                    )


                    echo BACKEND DOCKER BUILD SUCCESSFUL

                '''
            }
        }


        // ============================================================
        // PUSH BOTH IMAGES TO ECR
        // ============================================================

        stage('Push Images to ECR') {

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
                        echo Configuring AWS
                        echo ================================

                        aws configure set aws_access_key_id "%AWS_ACCESS_KEY_ID%"
                        aws configure set aws_secret_access_key "%AWS_SECRET_ACCESS_KEY%"
                        aws configure set region "%AWS_REGION%"


                        echo ================================
                        echo Logging into ECR
                        echo ================================

                        aws ecr get-login-password --region "%AWS_REGION%" | docker login --username AWS --password-stdin "351395891043.dkr.ecr.ap-south-1.amazonaws.com"


                        if errorlevel 1 (
                            echo ECR LOGIN FAILED
                            exit /b 1
                        )


                        echo ================================
                        echo Pushing Web Image
                        echo ================================

                        echo %ECR_REPO%:%IMAGE_TAG%

                        docker push "%ECR_REPO%:%IMAGE_TAG%"


                        if errorlevel 1 (
                            echo WEB ECR PUSH FAILED
                            exit /b 1
                        )


                        echo WEB ECR PUSH SUCCESSFUL


                        echo ================================
                        echo Pushing Backend Image
                        echo ================================

                        echo %BACKEND_ECR_REPO%:%IMAGE_TAG%

                        docker push "%BACKEND_ECR_REPO%:%IMAGE_TAG%"


                        if errorlevel 1 (
                            echo BACKEND ECR PUSH FAILED
                            exit /b 1
                        )


                        echo BACKEND ECR PUSH SUCCESSFUL


                        echo ================================
                        echo BOTH IMAGES PUSHED SUCCESSFULLY
                        echo ================================

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
        // VERIFY ECR IMAGES
        // ============================================================

        stage('Verify ECR Images') {

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
                        echo Verifying Web Image
                        echo ================================

                        aws ecr describe-images ^
                            --repository-name devops-task-manager ^
                            --image-ids imageTag=%IMAGE_TAG% ^
                            --region "%AWS_REGION%"


                        if errorlevel 1 (
                            echo WEB IMAGE NOT FOUND IN ECR
                            exit /b 1
                        )


                        echo ================================
                        echo Verifying Backend Image
                        echo ================================

                        aws ecr describe-images ^
                            --repository-name devops-task-manager-backend ^
                            --image-ids imageTag=%IMAGE_TAG% ^
                            --region "%AWS_REGION%"


                        if errorlevel 1 (
                            echo BACKEND IMAGE NOT FOUND IN ECR
                            exit /b 1
                        )


                        echo ================================
                        echo BOTH ECR IMAGES VERIFIED
                        echo ================================

                    '''
                }
            }
        }


        // ============================================================
        // DEPLOYMENT WILL BE ADDED NEXT
        // ============================================================

        /*
        stage('Deploy to AWS EC2') {

            // DO NOT ADD THIS YET.

            // The current EC2 deployment only runs the web container.
            // We first need to configure:
            //
            // 1. PostgreSQL
            // 2. Backend container
            // 3. Docker network
            // 4. Web container
            // 5. Database volume
            //
            // Then we will deploy the complete stack.
        }
        */

    }
}