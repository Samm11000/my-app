pipeline {
    agent any

    environment {
        EC2_IP      = '54.145.224.135'
        EC2_USER    = 'ubuntu'
        APP_DIR     = '/home/ubuntu/project'
        ALB_DNS     = 'my-app-alb-344711081.us-east-1.elb.amazonaws.com'
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Branch: ${env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Build') {
            steps {
                sh 'npm install'
                echo 'Build complete'
            }
        }

        stage('Test') {
            steps {
                echo 'No tests yet — Phase 7 mein add karenge'
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Deploying to EC2 ==='
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} '
                            cd ${APP_DIR} &&
                            git pull origin main &&
                            npm install &&
                            pm2 restart my-app &&
                            sudo systemctl reload nginx
                        '
                    """
                }
                echo "=== Deployed! Live at http://${ALB_DNS} ==="
            }
        }

    }

    post {
        success {
            echo "SUCCESS! http://${ALB_DNS}"
            echo "Health check: http://${ALB_DNS}/check"
        }
        failure {
            echo 'FAILED! Check console output above.'
        }
    }
}