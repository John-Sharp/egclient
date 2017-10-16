var jerverrest = function() {

var uname = "";
var pwd = ""; 
var loggedIn = false;

var getThreadEntryText = function(thread) {
    tet = '<br/><div class="threadTitle">';
    tet += '<input type="hidden" name="id" value="' + thread.Id + '"/>';
    tet += thread.Title;
    tet += '<span> (' + thread.NumMsgs + ' posts) </span>';
    tet += "</div>";

    return tet;
};

var getMessageEntryText = function(content) {
    met = '<div class="messageEntry">' + content + '</div>';
    return met;
}

var refreshThreadList = function() {
    $.ajax("http://localhost:8080/threads?page=0&count=5",
        {
            method : "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            dataType : "json",
            success : function ( response ) {
                $("#threadList").html("");
                for (i=0; i<response['Entities'].length; i++) {
                    $("#threadList").append(getThreadEntryText(response['Entities'][i]));   
                }

                $(".threadTitle").on("click", function() {
                    var threadId = $(this).find("[name='id']").val();
                    setThreadViewPage(threadId);
                });
            }
        });
};

var refreshThreadView = function(threadId) {
    $.ajax("http://localhost:8080/threads/" + threadId,
        {
            method : "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            dataType : "json",
            success : function ( response ) {
                $("#threadTitle").html("");
                $("#threadTitle").append(response.Title + "( " + response.NumMsgs + " posts)");
            }
        });

    $.ajax("http://localhost:8080/threads/" + threadId + "/messages?page=0&count=5",
        {
            method : "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            dataType : "json",
            success : function ( response ) {
                $("#messageList").html("");
                for (i=0; i<response['Entities'].length; i++) {
                    var met = $($.parseHTML(getMessageEntryText(response['Entities'][i].Content)));
                    $("#messageList").append(met);
                    var popMessageUserField = popMessageUserFieldFactory(met);
                    retrieveUser(response['Entities'][i].AuthorId, popMessageUserField);
                }
            }
        });
};

var popMessageUserFieldFactory = function (messageElement) {
    var popMessageUserField = function (user) {
        messageElement.append(" " + user.FirstName + " " + user.SecondName + " (" + user.Username + ")");
    };
    return popMessageUserField;
};

var retrieveUser = function(userId, cb) {
    $.ajax("http://localhost:8080/users/" + userId,
        {
            method : "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            dataType : "json",
            success : function ( response ) {
                cb(response);
            }
        });
};

var setVerificationPage = function() {
    $(document.body).html(
        '<div id="errorDiv"></div>' +
        '<div>Username: <input type="text" placeholder="username" name="userName"/></div>' +
        '<br/>' +
        '<div>Password: <input type="password" placeholder="password" name="password"/></div>' +
        '<br/>' +
        '<div><span id="logIn" class="greenButton" href="#">Log in</span></div>');


    $("#logIn").on("click", function() {
        uname = $("[name='userName']").val();
        pwd = $("[name='password']").val();

        $.ajax("http://localhost:8080/verification",
                {
                    method : "GET",
                    success : function () {

                        // put credentials in cookie that expires in 5 minutes
                        loggedIn = true;    
                        cookie.expiresMultiplier = 60;
                        cookie.set({uname : uname, pwd : pwd, loggedIn : 'true'}, {expires:5});

                        setThreadOverviewPage();
                    },
                    complete : function (res) {
                        if (res.status == 403) {
                            $("#errorDiv").html("incorrect username or password");
                        }
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Basic ' +
                            btoa(uname + ':' + pwd));
                    }
                });
    });
}

var setMainPage = function() {
    $(document.body).html(
    '<h1>User List</h1>' + 
    '<div id="createUserForm">' +
    '    <input type="text" placeholder="first name" name="firstName"/>' +
    '   <input type="text" placeholder="surname" name="secondName"/> ' +
    '   <span id="createUser" class="greenButton" href="#">Create</span>' +
    '</div>' +
    '<div id="userList"></div>'
    );

    refreshUserDiv();
    $("#createUser").on("click", function() {
        var createUserForm = {};
        createUserForm["FirstName"] = $("#createUserForm [name='firstName']").val();
        createUserForm["SecondName"] = $("#createUserForm [name='secondName']").val();

        $.ajax("http://localhost:8080/users",
                {
                    method : "POST",
                    data : JSON.stringify(createUserForm),
                    processData : false,
                    success : refreshUserDiv,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
                    }
                });
    });
};

var createNewThread = function(title, content) {
    var createThreadForm = {};
    createThreadForm["Title"] = title;
    $.ajax("http://localhost:8080/threads",
        {
            method : "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            data : JSON.stringify(createThreadForm),
            processData : false,
            success : function(r,t,j) {
                var locsp = j.getResponseHeader('Location').split('/');
                var threadId = locsp[locsp.length-1];
                createNewMessage(threadId, content, function() {
                    setThreadViewPage(threadId);
                });
            }
        });
};

var setNewThreadPage = function() {
    $(document.body).html("");
    appendHeaderBarText($(document.body));
    $(document.body).append(
        '<div>Title: <input name="threadTitle" placeholder="thread title"></input></div>' +
        '<div>Message: <textarea name="messageContent" placeholder="message text"></textarea></div>' +
        '<div><span class="greenButton" id="submitBtn">Post</span>' +
        '<span class="yellowButton" id="cancelBtn">Cancel</span>'
    );

    $('#cancelBtn').on('click', setThreadOverviewPage);

    $('#submitBtn').on('click', function() {
        var threadTitle = $('input[name="threadTitle"]').val();
        var messageContent = $('textarea[name="messageContent"]').val();
        createNewThread(threadTitle, messageContent);
    });
};

var setThreadOverviewPage = function() {
    $(document.body).html('');
    appendHeaderBarText($(document.body));
    $(document.body).append(
    '<div><span id="createThread" class="greenButton" href="#">Start a new thread...</span></div>' +
    '<div id="threadList"></div>'
    );

    $('#createThread').on('click', setNewThreadPage);

    refreshThreadList();
};

var setThreadViewPage = function(threadId) {
    $(document.body).html("");
    appendHeaderBarText($(document.body));
    $(document.body).append(
        '<div><span id="threadTitle"></span> <span id="mainPageButton" class="yellowButton">Main Page</span></div>' +
        '<div id="messageList"></div>' +
        '<div id="newMessageForm"><textarea name="content" placeholder="type message here"></textarea>' +
        '<span id="createMessage" class="greenButton">Post</span>' + 
        '</div>'
    );

    refreshThreadView(threadId);


    $("#createMessage").on("click", function() {
        var content = $("#newMessageForm [name='content']").val();
        createNewMessage(threadId, content, function() {
                        refreshThreadView(threadId);
                        $("#newMessageForm [name='content']").val(""); 
                    });
    });

    $("#mainPageButton").on("click", function() {
        setThreadOverviewPage();
    });
}

var createNewMessage = function(threadId, content, successCallback) {
    var createMessageForm = {};
    createMessageForm["Content"] = content;

    $.ajax("http://localhost:8080/threads/" + threadId + "/messages",
        {
            method : "POST",
            data : JSON.stringify(createMessageForm),
            processData : false,
            success : successCallback,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            }
        });
};

var logUserOut = function() {
    cookie.set("uname", "");
    cookie.set("pwd", "");
    cookie.set("loggedIn", false);
    setVerificationPage();
};

var appendHeaderBarText = function(elem) {
    var hbt = '<div id="headerBarText">';
    hbt += 'welcome, ' + uname + ' ';
    hbt += '<span class="redButton logOutButton">log out</span>';
    hbt += '</div>';
    elem.append(hbt);
    $('#headerBarText .logOutButton').on('click', logUserOut);
}

$(document).ready(function() {
    uname = cookie.get('uname');
    pwd = cookie.get('pwd'); 
    loggedIn = cookie.get('loggedIn') === 'true' ? true : false;

    if (!loggedIn) {
        setVerificationPage();
    } else {
        setThreadOverviewPage();
    }
});


}();
