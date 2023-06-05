pipeline {
    agent {
        node {
         label 'nodejs-14.19.0'
        }
    }
    
    parameters {
        string(name:'TAG_NAME',defaultValue: '',description:'')
    }

    options{
       buildDiscarder(logRotator(numToKeepStr: '10'))
    }

  environment {
    HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
    KUBECONFIG_CREDENTIAL_ID = 'pipeline-user-kubeconfig'
    APP_NAME = 'ur-utils-test-coverage-cli'
    GITLAB_URL = 'http://192.168.13.78/frontend/web/test-coverage-cli.git'
    WX_WORK_TOKEN = '11103d05-ea96-4031-994d-b2f91783d7fb'
  }

    stages {
        stage ('checkout scm') {
          steps {
            checkout(scm)
            script {
              sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/script/notify-qywx.py'
            }
          }
        }

        stage('develop publish'){
            when{
               branch 'develop'
            } 

            environment {
              HARBOR_HOST = 'bytest-harbor.ur.com.cn'
              HARBOR_NAMESPACE = 'ur-utils-test-coverage-cli-dev'
              HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
            }

            steps{
                container ('nodejs') {
                  // sh 'npm config set registry http://nexus.ur.com.cn/repository/npm-group/'
                  sh 'npm install -g npm-cli-adduser'
                  sh 'npm-cli-adduser -u pipeline-user -p !Q2w3e4r -e pipeline-user@ur.com.cn -r http://nexus.ur.com.cn/repository/npm-host'
                  sh 'npm install'
                  sh 'npm publish --tag beta'
                }
             }

            post {
                aborted {
                sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL dev发布取消 $WX_WORK_TOKEN'
                }
                success {
                sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL dev发布成功 $WX_WORK_TOKEN'
                }
                failure {
                sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL dev发布失败 $WX_WORK_TOKEN'
            }
            }           
      } 

        stage('prod publish'){
            when{
               branch 'master'
           } 

            steps{
                container ('nodejs') {
                  // sh 'npm config set registry http://nexus.ur.com.cn/repository/npm-group/'
                  sh 'npm install -g npm-cli-adduser'
                  sh 'npm-cli-adduser -u pipeline-user -p !Q2w3e4r -e pipeline-user@ur.com.cn -r http://nexus.ur.com.cn/repository/npm-host'
                  sh 'yarn install'
                  sh 'npm publish'
                }
             }

        post {
            aborted {
            sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL prod发布取消 $WX_WORK_TOKEN'
            }
            success {
            sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL prod发布成功 $WX_WORK_TOKEN'
            }
            failure {
            sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL prod发布失败 $WX_WORK_TOKEN'
         }
        }           
      }
    }
   } 