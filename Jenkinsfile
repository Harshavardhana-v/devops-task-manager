pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                git  branch: 'main',url:'https://github.com/Harshavardhana-v/devops-task-manager.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t devops-task-manager .'
            }
        }

        stage('Run Container') {
            steps {
                bat 'docker stop devops-task-manager || exit 0'
                bat 'docker rm devops-task-manager || exit 0'
                bat 'docker run -d --name devops-task-manager -p 5051:80 devops-task-manager'
            }
        }
    }
}