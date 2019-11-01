FROM node
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD src/ .
RUN npm i
EXPOSE 3001
CMD ["npm", "start"]