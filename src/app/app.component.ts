import { Component, ChangeDetectorRef  } from '@angular/core';
import {Stomp} from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import {HttpClient} from '@angular/common/http';
import {User} from './dto/user';

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
    if (this.userName == null || this.userName === "") {
      alert('Please input a nickname!');
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
      _this.stompClient.subscribe('/topic/broadcast', function (output) {
        // _this.message1 = JSON.parse(output.body);
        console.log('wiadomosc z kanalu topic/broadcast: ' + _this.message1);
      });

      _this.stompClient.subscribe('/topic/active', function () {
        console.log('wiadomosc z topic/active');
        _this.updateUsers(_this.userName);
      });

      _this.stompClient.subscribe('/user/queue/messages', function (output) {
        _this.createTextNode(JSON.parse(output.body));
      });

      _this.sendConnection(' connected to server');
      _this.connected = true;
    });
  }

  createTextNode(messageObj: any): void {
    var _from = messageObj.from;
    var _recipient = messageObj.recipient;
    var _text = messageObj.text;
    var _time = messageObj.time;

    console.log();
    console.log();
    console.log('From: ' + _from + ', recipient: ' + _recipient + ', text: ' + _text + ', time: ' + _time);
    console.log();
    console.log();
  }

  disconnect() {
    if (this.stompClient != null) {
      this.sendConnection(' disconnected from server')
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

  sendConnection(message: string): void {
    var text = this.userName + message;
    this.sendBroadcast({'from' : 'server', 'text': text});

    // for first time or last time, list active users:
    this.updateUsers(this.userName);
  }

  sendBroadcast(json) {
    this.stompClient.send("/app/broadcast", {}, JSON.stringify(json));
  }

  setSelectedUser(userName) {
    this.selectedUser = userName;
    console.log('Selected user: ' + this.selectedUser);
  }

  send(): void {
    this.stompClient.send("/app/chat", this.userName,
      JSON.stringify({'from': this.userName, 'text': this.textMessage, 'recipient': this.selectedUser}));
  }
}
