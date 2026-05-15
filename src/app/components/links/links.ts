import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface LinkItem {
  title: string;
  url: string;
}

@Component({
  selector: 'app-links',
  imports: [FormsModule],
  templateUrl: './links.html',
  styleUrl: './links.css',
})
export class Links {
  links: LinkItem[] = [
    {
      title: ' test الخاص بالبوابة',
      url: 'http://164.160.67.190/ppo/r/ppoportal/ppoportal/traffic?clear=14&cs=3LWw9ukRrM8ZBoE3b0hBGbuKOG-Xq7_kGUsksBKgRyhZR_beWYtcIcrcPDipF3WK8vG8jvmNm66FN1VBg-rkSJA',
    },
    {
      title: 'Test Backend (V6)',
      url: 'http://172.30.4.121/Traffic_V6/Default.aspx',
    },
    {
      title: 'Statging Backend(V10)',
      url: 'http://172.30.4.121/Traffic_V10/Default.aspx',
    },
    {
      title: 'Statging Backend(V12)',
      url: 'http://172.30.4.121/Traffic_V12/Default.aspx',
    },
    {
      title: 'RDL Report',
      url: 'http://172.30.5.112/reports/browse/',
    },
  ];

  constructor() {}
}
