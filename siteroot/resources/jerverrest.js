var jerverrest = function() {

var uname = "";
var pwd = "";

var getUserEntryText = function(uuid, fname, sname) {
    uet = "<div>";
    uet +='<input type="hidden" name="uuid" value="' + uuid + '"/>';
    uet +='<input type="text" name="firstName" value="' + fname + '"/>';
    uet += " ";
    uet +='<input type="text" name="secondName" value="' + sname + '"/>';
    uet += ' <span class="editUser" href="#">Edit</span> <span class="deleteUser" href="#">Delete</span></div>';

    $("#createUserForm [name='firstName']").val("");
    $("#createUserForm [name='secondName']").val("");
    return uet;
};

var refreshUserDiv = function() {
    $.ajax("http://localhost:8080/users",
        {
            method : "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
            },
            dataType : "json",
            success : function ( response ) {
                $("#userList").html("");
                for (i=0; i<response.length; i++) {
                    $("#userList").append(getUserEntryText(response[i].Uuid, response[i].FirstName, response[i].SecondName));   
                }

                $(".editUser").on("click", function() {
                    var editUserForm = {};
                    editUserForm["FirstName"] = $(this).parent().find("[name='firstName']").val();
                    editUserForm["SecondName"] = $(this).parent().find("[name='secondName']").val();

                    $.ajax("http://localhost:8080/users/"+$(this).parent().find("[name='uuid']").val(),
                        {
                            method : "PUT",
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
                            },
                            data : JSON.stringify(editUserForm),
                            processData : false,
                            success : refreshUserDiv
                        });
                });

                $(".deleteUser").on("click", function() {
                    $.ajax("http://localhost:8080/users/"+$(this).parent().find("[name='uuid']").val(),
                        {
                            method : "DELETE",
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(uname + ':' + pwd));
                            },
                            success : refreshUserDiv
                        });
                });
            }
        });
};

var loggedIn = false;

var setVerificationPage = function() {
    $(document.body).html(
        '<div id="errorDiv"></div>' +
        '<div>Username: <input type="text" placeholder="username" name="userName"/></div>' +
        '<br/>' +
        '<div>Password: <input type="password" placeholder="password" name="password"/></div>' +
        '<br/>' +
        '<div><span id="logIn" class="greenButton" href="#">Log in</span></div>');


    $("#logIn").on("click", function() {
        var verificationForm = {};
        verificationForm["UserName"] = $("[name='userName']").val();
        verificationForm["Password"] = $("[name='password']").val();

        $.ajax("http://localhost:8080/verification",
                {
                    method : "GET",
                    success : function () {
                        loggedIn = true;    
                        uname = verificationForm["UserName"];
                        pwd = verificationForm["Password"]
                        setMainPage();
                    },
                    complete : function (res) {
                        if (res.status == 403) {
                            $("#errorDiv").html("incorrect username or password");
                        }
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Basic ' +
                            btoa(verificationForm["UserName"] + ':' + verificationForm["Password"]));
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

$(document).ready(function() {
    if (!loggedIn) {
        setVerificationPage();
    } else {
        setMainPage();
    }
});


}();
