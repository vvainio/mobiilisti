/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        document.addEventListener("backbutton", function(e) {
            if ($.mobile.activePage.is('#containerPage') ||$ .mobile.activePage.is('#taskview')) {
                //
            } else if ($.mobile.activePage.is('#campusview') || $.mobile.activePage.is('#complete') || $.mobile.activePage.is('#end')) {
                e.preventDefault();
                if (typeof Game.language === 'undefined' || Game.language === 'en') {
                    navigator.notification.confirm(
                        'Exit BioTrek?', function(button) {
                            if (button == 2) {
                              navigator.app.exitApp();
                            }
                          }, 'Exit', 'No,Yes'
                    );
                } else {
                    navigator.notification.confirm(
                        'Suljetaanko BioTrek?', function(button) {
                            if (button == 2) {
                              navigator.app.exitApp();
                            }
                          }, 'Lopeta', 'Ei,Kyllä'
                    );
                }
            } else {
                navigator.app.backHistory();
            }
        }, false);

        function loadUrl(url) {
            navigator.app.loadUrl(url, { openExternal:true });
        }

        function onNfc(nfcEvent) {
            var tag   = nfcEvent.tag;
            var tagId = nfc.bytesToHexString(tag.id);
            var uri   = "http://tagglem.com/n/" + tagId;

            loadUrl(uri);
        }

        function nfcOk() {
            console.log("Listening for NFC Tags");
        }

        function nfcFail(error) {
            console.log("Error adding NFC listener");
        }

        nfc.addTagDiscoveredListener(onNfc, nfcOk, nfcFail);
    }
};
