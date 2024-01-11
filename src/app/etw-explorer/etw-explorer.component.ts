import {
  Component, ViewChild, AfterViewInit, OnInit, ElementRef, QueryList
} from '@angular/core';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import 'signalr';


declare var $: any;

interface expandedRows {
    [key: string]: boolean;
}


@Component({
  selector: 'app-etw-explorer',
  templateUrl: './etw-explorer.component.html',
  styleUrls: ['./etw-explorer.component.scss']
})
export class EtwExplorerComponent implements AfterViewInit, OnInit {
  @ViewChild('dt2') table!: Table;
  @ViewChild('resultsContainer') resultsContainer!: ElementRef;

  ngAfterViewInit(): void {
    this.fetchProviderListing();
}

  providerListing: EtwProvider[] = [];
  etwSamples: ETWSample[] = [];
  selectedSample: any = null;
  etwSample!: ETWSample;
  selectedProvider: any = null;
  loading: boolean = true;
  private connection: any;
  queryResults: string[] = [];

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
    this.connection = $.hubConnection('/signalr');
    const hubProxy = this.connection.createHubProxy('explorerHub');
  
    // Add event handlers for the hub
    hubProxy.on('addMessage', (data: string) => {
      let parsedData = JSON.parse(data);
      this.etwSample = parsedData;
      this.etwSamples.push(this.etwSample);
      console.log(JSON.stringify(this.etwSample)); // This will now be an object
      this.cd.detectChanges();
      setTimeout(() => {
        this.table.value = this.etwSamples;
        this.cd.detectChanges();
    }, 0);
    });
  
    // Start the connection
    this.connection.start()
      .done(() => {
        console.log('Connected to the hub');
      })
      .fail((error: any) => {
        console.error('Failed to connect to the hub:', error);
      });
}

ngOnInit() {
    this.loading = false;
}

fetchProviderListing() {
  this.http.get<ApiResponse>('/api/EtwExplorer').subscribe(response => {
      this.providerListing = response.response;
      console.log('providers: ' + JSON.stringify(this.providerListing))
  });
}

startProvider() {
  const selectedRow = this.table.selection;
        const providerName = this.selectedProvider.ProviderName;
        // const encodedContent = encodeURIComponent(queryString);
        this.enableProvider(providerName).subscribe(
          (response) => {
              console.log('Success:', response);
          },
          (error) => {
              console.log('Error:' + JSON.stringify(error));
          }
      );
}

stopProvider() {
  this.disableProvider().subscribe(
    (response) => {
        console.log('Success:', response);
    },
    (error) => {
        console.log('Error:' + JSON.stringify(error));
    }
);
}

enableProvider(providerName: string): Observable<any> {
  const apiUrl = `/api/EtwExplorer?providerName=${providerName}`;
  return this.http.put(apiUrl, null);
}

disableProvider(): Observable<any> {
  const stopApiUrl = '/api/EtwExplorer';
  return this.http.post(stopApiUrl, null);
}

onGlobalFilter(table: Table, event: Event) {
  table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
}

clear(table: Table) {
  this.etwSamples = [];
}

}

export interface ApiResponse {
  response: EtwProvider[];
}

export interface  EtwProvider {
  ProviderName: string;
}

export interface ETWSample {
  ComputerName: string;
  ProviderName: string;
  ProviderGuid: string;
  EventName: string;
  Message: string;
  ActivityId: string;
  TimeStamp: string;
  PID: number;
  ProcessName: string;
  SampleId: string;
}