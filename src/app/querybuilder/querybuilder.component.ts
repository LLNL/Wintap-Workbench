import {
    Component, ViewChild, AfterViewInit, OnInit, ElementRef, QueryList
} from '@angular/core';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import 'codemirror/mode/sql/sql';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import * as CodeMirror from 'codemirror';
import 'codemirror/addon/mode/overlay';
import './wintapmessage';
import 'signalr';
import 'codemirror/addon/hint/show-hint';

declare var $: any;

interface expandedRows {
    [key: string]: boolean;
}

@Component({
  selector: 'app-querybuilder',
  templateUrl: './querybuilder.component.html',
    styleUrls: ['./querybuilder.component.css']
})
export class QuerybuilderComponent implements AfterViewInit, OnInit {

    @ViewChild('editor') codeEditor!: CodemirrorComponent;
    @ViewChild('nameField') nameField!: ElementRef;
    @ViewChild('dt1') table!: Table;
    @ViewChild('resultsContainer') resultsContainer!: ElementRef;

    ngAfterViewInit(): void {
        configureCodeMirror();
        setTimeout(() => {
            if (this.codeEditor && this.codeEditor.codeMirror) {
              const editor = this.codeEditor.codeMirror;
              console.log('CodeMirror is initialized:', this.codeEditor.codeMirror);
              editor.setOption('extraKeys', {
                "Ctrl-Space": "autocomplete"
              });
        
              editor.setOption('hintOptions', {
                hint: this.customHintFunction
              });
            } else {
              console.error('CodeMirror instance is not available.');
            }
        }, 500);  

        this.fetchEplListing();
    }

    eplListing: Statement[] = [];
    selectedStatement: any = null;
    loading: boolean = true;
    showConfirmDialog = false;
    showInvalidQueryDialog = false;
    private connection: any;
    queryResults: string[] = [];
    queryError: string = '';

    constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
        this.connection = $.hubConnection('/signalr');
        const hubProxy = this.connection.createHubProxy('workbenchHub');
      
        // Add event handlers for the hub
        hubProxy.on('addMessage', (data: any) => {
          this.queryResults.push(decodeURIComponent(data));
          this.cd.detectChanges();
          setTimeout(() => this.scrollToBottom(), 0);
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

    private customHintFunction(editor: any): any {

        interface IObjectProperties {
            [key: string]: string[];
          }

        interface IActivityProperties {
            [key: string]: string;
        }
          
          interface ISuggestion {
            text: string;
            displayText: string;
          }
          
          const objectProperties: IObjectProperties = {
            'WintapMessage': ['PID', 'EventTime', 'ProcessName', 'MessageType', 'ReceiveTime', 'PidHash', 'ActivityType', 'CorrelationId', 'ActivityId'],
            'Process': ['ParentPID', 'ParentPidHash', 'ParentProcessName', 'Name', 'Path', 'CommandLine', 'Arguments', 'User', 'ExitCode', 'CPUCycleCount', 'CPUUtilization', 'CommitCharge', 'CommitPeak', 'ReadOperationCount', 'WriteOperationCount', 'ReadTransferKiloBytes', 'WriteTransferKiloBytes', 'HardFaultCount', 'TokenElevationType', 'PID', 'UniqueProcessKey', 'MD5', 'SHA2'],
            'TcpConnection': ['Direction', 'SourceAddress', 'SourcePort', 'DestinationAddress', 'DestinationPort', 'State', 'MaxSegSize', 'RcvWin', 'RcvWinScale', 'SackOpt', 'SeqNo', 'PacketSize', 'SendWinScale', 'TimestampOption', 'WinScaleOption', 'EndTime', 'StartTime', 'FailureCode', 'PID'],
            'UdpPacket': ['SourceAddress', 'SourcePort', 'DestinationAddress', 'DestinationPort', 'PacketSize', 'PID'],
            'ImageLoad': ['FileName', 'BuildTime', 'ImageChecksum', 'ImageSize', 'DefaultBase', 'ImageBase', 'MD5'],
            'File': ['Path', 'BytesRequested'],
            'Registry': ['Path', 'DataType', 'ValueName', 'Data',],
            'FocusChange': ['OldProcessId', 'FocusChangeSessionId'],
            'WaitCursor': ['SessionId', 'DisplayTimeMS'],
            'GenericMessage': ['Provider', 'EventName', 'Payload'],
            'WmiActivity': ['OperationId', 'Operation', 'User', 'IsLocal', 'ResultCode'],
            'EventlogEvent': ['LogName', 'LogSource', 'EventId', 'EventMessage'],
            'KernelApiCall': ['ProviderName', 'TargetPid', 'DesiredAccess', 'ReturnCode', 'LinkSourceName', 'LinkTargetName', 'NotifyRoutineAddress', 'TargetThreatId'],
            'MemoryMap': ['Description', 'BaseAddress', 'AllocationBaseAddress', 'AllocationProtect', 'RegionSize', 'PageProtect', 'PageSize'],
          };

          const activityProperties: IActivityProperties = {
            'start': 'start',
            'stop': 'stop',
            'refresh': 'refresh',
            'WRITE': 'WRITE',
            'READ': 'READ',
            'CLOSE': 'CLOSE'
          }

          let suggestions: ISuggestion[] = [];

          const cursor = editor.getCursor();
          const lineContent = editor.getLine(cursor.line);
          const textBeforeCursor = lineContent.substring(0, cursor.ch);
        
          // Regular expression to match "MessageType =" or "MessageType="
          const messageTypeRegex = /messagetype\s*=\s*$/i;
          const activityTypeRegex = /activitytype\s*=\s*$/i;
        
          if (messageTypeRegex.test(textBeforeCursor)) {
            console.log("MessageType context recognized");
            suggestions = Object.keys(objectProperties).map(key => {
              let displayText = key;
              let text = key;
              if (key.toLowerCase() === 'process' || key.toLowerCase() === 'tcpconnection' || key.toLowerCase() === 'udppacket' || key.toLowerCase() == 'imageload'|| key.toLowerCase() == 'file'|| key.toLowerCase() == 'registry' || key.toLowerCase() == 'focuschange' || key.toLowerCase() == 'waitcursor' || key.toLowerCase() == 'genericmessage' || key.toLowerCase() == 'wmiactivity'|| key.toLowerCase() == 'eventlogevent'|| key.toLowerCase() == 'kernelapicall'|| key.toLowerCase() == 'memorymap' ) {
                text = `"${key}"`;
              }
              return { text, displayText };
            });
          } else if (activityTypeRegex.test(textBeforeCursor)) {
            console.log("ActivityType context recognized");
            suggestions = Object.keys(activityProperties).map(key => {
              let displayText = key;
              let text = `"${key}"`;
              return { text, displayText };
            });
          } else {
            const match = textBeforeCursor.match(/(\w+)\.$/i);
            if (match) {
              const key = match[1].toLowerCase(); 
              const lowerCaseProperties: IObjectProperties = {};
              // Convert all keys in objectProperties to lowercase
              Object.keys(objectProperties).forEach(currentKey => {
                lowerCaseProperties[currentKey.toLowerCase()] = objectProperties[currentKey];
              });
        
              if (key in lowerCaseProperties) {
                suggestions = lowerCaseProperties[key].map(prop => ({ text: prop, displayText: prop }));
              }
            }
          }
        
          return {
            list: suggestions,
            from: CodeMirror.Pos(cursor.line, cursor.ch),
            to: CodeMirror.Pos(cursor.line, cursor.ch)
          };
        }      

    onSort() {
        // TODO
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clear(table: Table) {
        this.deleteEpl() ;
    }

    activateEpl(eplName: string) {
        this.queryResults = [];
        const codeMirrorInstance = this.codeEditor.codeMirror;
        const editorContent = codeMirrorInstance!.getValue();
        const encodedContent = encodeURIComponent(editorContent);
        this.addStream(eplName, encodedContent, "ACTIVE").subscribe(
            (response) => {
                console.log('Success:', response);
                this.fetchEplListing();
            },
            (error) => {
                console.log('Error:' + JSON.stringify(error));
                this.queryError = error.error.Message;;
                this.showInvalidQueryDialog = true;
            }
        );
    }

    startEpl() {
        const selectedRow = this.table.selection;
        const eplName = selectedRow.Name;
        const queryString = selectedRow.Query;
        const encodedContent = encodeURIComponent(queryString);
        this.addStream(eplName, encodedContent, "START").subscribe(
          (response) => {
              console.log('Success:', response);
              this.fetchEplListing();
          },
          (error) => {
              console.log('Error:' + JSON.stringify(error));
              this.queryError = error.error.Message;;
              this.showInvalidQueryDialog = true;
          }
      );
    }

    stopEpl() {
        const selectedRow = this.table.selection;
        const eplName = selectedRow.Name;
        const queryString = selectedRow.Query;
        const encodedContent = encodeURIComponent(queryString);
        this.addStream(eplName, encodedContent, "STOP").subscribe(
          (response) => {
              console.log('Success:', response);
              this.fetchEplListing();
          },
          (error) => {
              console.log('Error:' + JSON.stringify(error));
              this.queryError = error.error.Message;;
              this.showInvalidQueryDialog = true;
          }
      );
    }

    deleteOneEpl() {
      const selectedRow = this.table.selection;
      const eplName = selectedRow.Name;
      const queryString = selectedRow.Query;
      const encodedContent = encodeURIComponent(queryString);
      this.addStream(eplName, encodedContent, "DELETE").subscribe(
        (response) => {
            console.log('Success:', response);
            this.fetchEplListing();
        },
        (error) => {
            console.log('Error:' + JSON.stringify(error));
            this.queryError = error.error.Message;;
            this.showInvalidQueryDialog = true;
        }
    );
  }

    editEpl() {
        const selectedRow = this.table.selection;
        const name = selectedRow.Name;
        const queryString = selectedRow.Query;
        var decodedString = queryString;
        try{
            decodedString = decodeURIComponent(queryString);
        }
        catch(error) {
            console.log(error);
        }
        this.codeEditor.codeMirror!.setValue(decodedString);
        this.nameField.nativeElement.value = name;
    }

    deleteEpl() {  
        this.confirmDelete(); // Display the confirmation dialog
    }

    deleteConfirmed() {
        const apiUrl = `/api/Streams/`;
        this.http.delete(apiUrl).toPromise()
          .then(() => {
            this.fetchEplListing();
            this.showConfirmDialog = false;
            this.cd.detectChanges();
          });
      }

    confirmDelete() {
        this.showConfirmDialog = true;
      }

    addStream(shortName: string, queryString: string, stateString: string): Observable<any> {
        const apiUrl = `/api/Streams?name=${shortName}&query=${queryString}&state=${stateString}`;
        return this.http.post(apiUrl, null);
    }

    fetchEplListing() {
        this.http.get<ApiResponse>('/api/Streams').subscribe(response => {
            this.eplListing = response.response;
            console.log(JSON.stringify(this.eplListing))
        });
    }

    private scrollToBottom() {
        const container = this.resultsContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
      
}

function configureCodeMirror() {
    CodeMirror.defineMode('wintapOverlay', (config, parserConfig) => {
      const esperMode = CodeMirror.getMode(config, 'text/x-esper');
      const myOverlayMode = CodeMirror.getMode(config, 'wintapmessage');
      return CodeMirror.overlayMode(esperMode, myOverlayMode);
    });
  }
  

export interface ApiResponse {
    response: Statement[];
}

export interface Statement {
    Name: string;
    Query: string;
    StatementType: string | null;
    State: string | null;
    CreateDate: number;
}

