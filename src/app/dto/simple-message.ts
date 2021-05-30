export class SimpleMessage {
  text: string;
  userVerifiedSuccessfully: boolean;

  constructor(text: string, userVerifiedSuccessfully: boolean) {
    this.text = text;
    this.userVerifiedSuccessfully = userVerifiedSuccessfully;
  }

}
