import {ChangeDetectorRef, Component} from '@angular/core';
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
  user: User = new User();

  users: string[] = [];
  disabled = true;
  name: string;
  private stompClient;
  userName: string;

  constructor(private http: HttpClient, private change: ChangeDetectorRef) {}

  connect(): void {
    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = Stomp.over(socket);
    const _this = this;
    this.stompClient.connect({userName: this.userName}, function () {

      this.stompClient.subscribe('http://localhost:8080/topic/broadcast', function (output) {
        _this.printInConsole(JSON.parse(output.body));
      });

        // this.stompClient.subscribe('http://localhost:8080/topic/active', function () {
        //   _this.updateUsers(this.userName);
        // });
        //
        // this.stompClient.subscribe('/user/queue/messages', function (output) {
        //   _this.printInConsole(JSON.parse(output.body));
        // });
        //
        // _this.sendConnection(' connected to server');

    });

    this.http.post('http://localhost:8080/rest/user-connect', this.userName).subscribe(data => {
      console.log(data);
    }, error => {
      console.error(error);
    })

  }

  disconnect(): void {
    if(this.stompClient != null) {
      this.http.post('http://localhost:8080/rest/user-disconnect', this.userName).subscribe(data => {
          console.log(data);
        }, error => {
          console.error(error);
        }
      );

      this.stompClient.disconnect(function() {
        console.log('disconnected');
      });
    }
  }

  updateUsers(userName: string): void {
    this.http.get<string[]>("http://localhost:8080/rest/active-users-except/" + userName).subscribe(data=> {
      this.users = data;
      console.log('users: ' + this.users);
      this.change.detectChanges();
    }, error => {
      console.error(error);
    })
  }

  sendConnection(message: string): void {
    const text = this.userName + message;
    this.sendBroadcast({'from': 'server', 'text': text});

    this.updateUsers(this.userName);
  }

  sendBroadcast(json: any): void {
    if(this.stompClient != null) {
      this.stompClient.send('/app/broadcast', {}, JSON.stringify(json));
    }
  }

  printInConsole(messageObject: any): void {
    console.log('message: \n' + 'from: ' + messageObject.from + "\n recipient: " + messageObject.recipient
    + '\n text: ' + messageObject.text + '\n time: ' + messageObject.time);
  }
}

