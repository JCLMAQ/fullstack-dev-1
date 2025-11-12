import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MessagesService } from '@fe/services';

@Component({
  selector: 'lib-messages',
  imports: [NgClass, MatButtonModule, MatIcon],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages {
  messagesService = inject(MessagesService);

  message = this.messagesService.message;

  onClose() {
    this.messagesService.clear();
  }
}
