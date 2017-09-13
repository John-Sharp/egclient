var jerverrest = function() {

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
    $.get("http://localhost:8080/users", function( response ) {
        $("#userList").html("");
        for (i=0; i<response.length; i++) {
            $("#userList").append(getUserEntryText(response[i].Uuid, response[i].FirstName, response[i].SecondName));   
        }

        $(".editUser").on("click", function() {
            var editUserForm = {};
            editUserForm["firstName"] = $(this).parent().find("[name='firstName']").val();
            editUserForm["secondName"] = $(this).parent().find("[name='secondName']").val();

            $.ajax("http://localhost:8080/users/"+$(this).parent().find("[name='uuid']").val(),
                    {
                        method : "PUT",
                        data : editUserForm,
                        success : refreshUserDiv
                    });
        });

        $(".deleteUser").on("click", function() {
            $.ajax("http://localhost:8080/users/"+$(this).parent().find("[name='uuid']").val(),
                    {
                        method : "DELETE",
                        success : refreshUserDiv
                    });
        });

    }, "json");

};

$(document).ready(function() {
    refreshUserDiv();
    $("#createUser").on("click", function() {
        var createUserForm = {};
        createUserForm["firstName"] = $("#createUserForm [name='firstName']").val();
        createUserForm["secondName"] = $("#createUserForm [name='secondName']").val();

        $.post("http://localhost:8080/users", createUserForm, refreshUserDiv);
    });
});


}();
