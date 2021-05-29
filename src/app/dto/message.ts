export class Message {
  from: string;
  recipient: string;
  text: string;
  time: string;


  constructor(from: string, recipient: string, text: string, time: string) {
    this.from = from;
    this.recipient = recipient;
    this.text = text;
    this.time = time;
  }
}
