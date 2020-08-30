FROM tomcat:latest
RUN rm -rf /usr/local/tomcat/webapps.dist
RUN mkdir /usr/local/tomcat/webapps/ROOT

COPY src/capture/ /usr/local/tomcat/webapps/ROOT