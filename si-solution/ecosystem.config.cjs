module.exports = {
  apps: [
    {
      name: 'kms-backend',
      cwd: '/home/user/webapp/si-solution/kms-backend',
      script: 'mvn',
      args: 'spring-boot:run',
      interpreter: 'none',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        JAVA_HOME: '/usr/lib/jvm/java-21-openjdk-amd64'
      }
    }
  ]
}
