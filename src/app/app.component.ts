import { Component, ChangeDetectorRef  } from '@angular/core';
import {Stomp} from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import {HttpClient} from '@angular/common/http';
import {User} from './dto/user';
import {Message} from './dto/message';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'habababa';
  description = 'Angular-WebSocket Demo';
  user: User;
  usersList: string[] = [];
  greetings: string[] = [];
  messages: Message[] = [];
  name: string;
  private stompClient;
  userName: string;
  message1: string;
  message2: string;
  selectedUser: string;
  textMessage: string;
  connected: boolean = false;

  constructor(private http: HttpClient, private changeDetection: ChangeDetectorRef) { }

  connect() {
    if (this.isUsernameIncorrect()) {
      alert('Please input a correct nickname!');
      return;
    }

    this.http.post<string>('http://localhost:8080/rest/user-connect',{username: this.userName})
      .subscribe(data => {
          console.log(data);
        },
        err => {
          console.error(err);
        });

    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = Stomp.over(socket);
    const _this = this;
    this.stompClient.connect({username: _this.userName}, function (frame) {
      console.log('Connected: ' + frame);

      _this.stompClient.subscribe('/topic/active', function () {
        console.log('wiadomosc z topic/active');
        _this.updateUsers(_this.userName);
      });

      _this.stompClient.subscribe('/user/queue/messages', function (output) {
        _this.createTextNode(JSON.parse(output.body));
      });

      _this.sendConnection();
      _this.connected = true;
    });
  }

  private isUsernameIncorrect() {
    return this.userName == null ||
      this.userName === '' ||
      this.userName.includes('?') ||
      this.userName.includes('&') ||
      this.userName.includes(' ');
  }

  createTextNode(messageObj: any): void {
    var _from = messageObj.from;
    var _recipient = messageObj.recipient;
    var _text = messageObj.text;
    var _time = messageObj.time;

    this.messages.push(new Message(_from, _recipient, _text, _time));
    this.changeDetection.detectChanges();
  }

  disconnect() {
    if(this.stompClient != null) {
      this.http.post<string>('http://localhost:8080/rest/user-disconnect',{username: this.userName})
        .subscribe(data => {
            console.log(data);
          },
          err => {
            console.error(err);
          });
        this.sendConnection()
        this.stompClient.disconnect();
    }
    this.connected = false;
    console.log('Disconnected!');
  }

  updateUsers(userName: string): void {
    this.http.get<string[]>('http://localhost:8080/rest/active-users-except/' + userName).subscribe(data=> {
        this.usersList = data;
        // this.usersList = JSON.parse(JSON.stringify(data));
        console.log('received data from updateUsers: ' + this.usersList);
        this.changeDetection.detectChanges();
      },
      error => {
        console.error('update user error: ' + error);
      });
  }

  showMessage(message: string) {
    console.log('message: ' + message);
  }

  sendConnection(): void {
      this.updateUsers(this.userName);
  }

  setSelectedUser(userName) {
    this.selectedUser = userName;
    console.log('Selected user: ' + this.selectedUser);
  }

  send(): void {
    if(this.selectedUser != null) {
      this.stompClient.send("/app/chat", this.userName,
        JSON.stringify({'from': this.userName, 'text': this.textMessage,
          'recipient': this.selectedUser, 'time' : new Date().getTime()}));
    } else {
      alert('Please select user!');
      return;
    }
  }
}
