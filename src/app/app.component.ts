import { Component } from '@angular/core';
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
  title = 'grokonez';
  description = 'Angular-WebSocket Demo';
  user: User = new User();

  greetings: string[] = [];
  disabled = true;
  name: string;
  private stompClient;
  userName = 'heszke w meszke';

  constructor(private http: HttpClient) { }

  setConnected(connected: boolean): void {
    this.disabled = !connected;

    if (connected) {
      this.greetings = [];
    }
  }

  connect(): void {
    // if (this.userName == null || this.userName === "") {
    //   alert('Please input a nickname!');
    //   return;
    // }

    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = Stomp.over(socket);
    const _this = this;
    this.stompClient.connect({}, function (frame) {
      _this.setConnected(true);
      console.log('Connected: ' + frame);

      _this.stompClient.subscribe('/topic/broadcast', function (hello) {
        _this.showGreeting(JSON.parse(hello.body).greeting);
      });

      _this.stompClient.subscribe('/topic/active', function () {
        this.updateUsers(this.userName);
      });

      _this.stompClient.subscribe('/user/queue/messages', function (output) {
        this.showMessage('pozniej to dodam');
      });

      this.sendConnection(' connected to server');
    });


    console.log('pierdolony name!!!!!!!:::      ' + _this.userName);

    this.http.post<string>('http://localhost:8080/rest/user-connect',{userName: this.userName})
      .subscribe(data => {
      console.log(data);
    },
      err => {
        console.error(err);
      });
  }

  updateUsers(userName: string): void {
    //cos tam bedzie robic
    console.log('teraz updatuje usera ' + userName);
  }

  showMessage(message: string) {
    console.log('message: ' + message);
  }

  sendConnection(message: string): void {
    var text = this.userName + message;
    this.sendBroadcast('jakis json');

    // for first time or last time, list active users:
    this.updateUsers(this.userName);
  }

  sendBroadcast(json: string) {
    this.stompClient.send("/app/broadcast", {}, JSON.stringify(json));
  }

  disconnect() {
    if (this.stompClient != null) {
      this.stompClient.disconnect();
    }

    this.setConnected(false);
    console.log('Disconnected!');
  }

  sendName() {
    this.stompClient.send(
      '/gkz/hello',
      {},
      JSON.stringify({ 'name': this.name })
    );
  }

  showGreeting(message) {
    this.greetings.push(message);
  }
}
