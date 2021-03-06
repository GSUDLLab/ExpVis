
var dir_tree = null;
var global_temp_data = null;
var dataset_chose = null;
var size_chosen = null;
var method_chosen = null;
var exp_chosen = null;
var plot_data = [];
var plot_index = [];
var sub_names = [];
var real_time_data = [];
var group_color = {};
var groups = [];
var layout = {
    title: "place holder",
    margin: {
        b: 50,
        t: 50
    },
    width: 700,
    showlegend: true,
};

function dir_button(level, name) {
    var template = '<a class="btn btn-default col-md-12 dir" style="white-space: normal;" href="#" role="button" onclick="choose_directory(this, {0}, \'{1}\')">{2}</a>';
    return template.format(level, name, name);
}

function del_dir_button(level, name) {
    var template = '<a class="btn btn-default col-md-4" style="white-space: normal;" href="##" role="button" onclick="operate_directory(this, {0}, \'{1}\', 0)">delete</a>';
    return template.format(level, name);
}

function rename_dir_button(level, name) {
    var template = '<a class="btn btn-default col-md-4" style="white-space: normal;" href="##" role="button" onclick="operate_directory(this, {0}, \'{1}\', 1)">name</a>';
    return template.format(level, name);
}

function file_button(level, name) {
    var template = '<a class="btn btn-default col-md-12" style="white-space: normal;" href="#" role="button" onclick="draw_file(this, {0})">{1}</a>';
    return template.format(level, name);
}

function up_dir() {
    var spans = $("#dir_path").children("span");
    var levels = spans.children("select");
        
    choose_directory(null, levels.length - 3, levels[levels.length-3].value);
}

function choose_directory(obj, level, name) {
    var spans = $("#dir_path").children("span");
    var levels = spans.children("select");
    var path = "."
    for (var i = 1; i < level; i++) {
        path += "/" + $(levels[i-1]).val();
    }
    if (name == "") {
        path += "/" + $(obj).val();
    } else {
        $(levels[level-1]).val(name);
        path += "/" + name;
    }
    console.log(path);
    $.ajax({
        method: "post",
        url : "/get_lists_in_dir.html",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({"dir": path}),
        success : function (data){
            var list = data.data;
            global_temp_data = data.data
            $("#sub_files").empty();
            for (var i in list[0]) {
                var temp = file_button(level+1, list[0][i]);
                $("#sub_files").append(temp)
            }
            $("#sub_dirs").empty();
            for (var i in list[1]) {
                var div = $('<div class="col-md-12"></div>')
                var temp = dir_button(level+1, list[1][i]);
                div.append(temp);
                if (list[1][i].indexOf("|") > -1) {
                    temp = del_dir_button(level+1, list[1][i]);
                    div.append(temp);
                    temp = rename_dir_button(level+1, list[1][i]);
                    div.append(temp);
                } else {
                    temp = del_dir_button(level+1, list[1][i], 4);
                    div.append(temp);
                }
                $("#sub_dirs").append(div);
            }

            for (var i = level; i < spans.length; i++) {
                var span = spans[i];
                span.remove();
            }
            var new_span = $("<span></span>");
            var new_select = $("<select></select>");
            new_select.attr("onchange", "choose_directory(this, {0}, '')".format(level+1));
            new_select.append('<option disabled selected value="0">default</option>"');
            for (var i in list[1]) {
                new_select.append('<option value="{0}">{1}</option>'.format(list[1][i], list[1][i]));
            }
            new_span.append(new_select);
            new_span.append("<span>/</span>")
            $("#dir_path").append(new_span);
        }
    });
}

function operate_directory(obj, level, name, op) {
    var spans = $("#dir_path").children("span");
    var levels = spans.children("select");
    var path = "."
    var div = $(obj);
    for (var i = 1; i < level; i++) {
        path += "/" + $(levels[i-1]).val();
    }
    if (name == "") {
        path += "/" + $(obj).val();
    } else {
        $(levels[level-1]).val(name);
        path += "/" + name;
    }
    
    $.ajax({
        method: "post",
        url : "/operate_dir",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({"dir": path, "op": op}),
        success : function (data){
            console.log(div);
            if (data.info.indexOf("success") > -1) {
                if (op == 0) {
                    div.parent().remove()
                } else {
                    div.parent().children(".dir").html(data.name);
                }
                
            } else {
                alert(data.info);
            }
        }
    });
}

function draw_file(obj, level) {
    var spans = $("#dir_path").children("span");
    var levels = spans.children("select");
    var path = ".";
    var data_name = "";
    var size = "";
    var group_name = "";
    group_name = $(levels[level-2]).val();
    for (var i = 1; i < level; i++) {
        path += "/" + $(levels[i-1]).val();
        var parts = $(levels[i-1]).val().split("=");
        if (parts.length != 2)
            continue;
        switch(parts[0]) {
            case "dataset":
                data_name = parts[1];
                break;
            case "size":
                size = parts[1];
                break;
        }
    }
    path += "/" + $(obj).html();
    var ele = $(obj);
    var file = ele.html();
    var file_path = path;

    var file_name = file.split("/")[file.split("/").length-1];
    var file_parts = file_name.split("_")
    var metric = ""
    var contain_flag = false;
    var canvas_id = 0;
    for (var i = 0; i < Math.min(file_parts.length, 2); i++) {
        if (file_parts[i] == "")
            continue;
        var prefix = file_parts[i].substring(0, 3);
        if (prefix == "val" || prefix == "tes" || prefix == "tra" || prefix == "de" || prefix == "ste" || prefix == "par") {
            continue;
        }
        metric = file_parts[i];
        for (var j = 0; j < sub_names.length; j++) {
            if (sub_names[j] == metric) {
                contain_flag = true;
                canvas_id = j;
                break;
            }
        }
        if (contain_flag == false) {
            canvas_id = sub_names.length;
            sub_names.push(metric);
        }
    }
    $.ajax({
        method: "post",
        url : "/get_result_array",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({"file": file_path}),
        success : function (data){
            var list = data.data;

            if (list.x.length == 0) {
                $("#text").html(list.content);
                return;
            }
            global_temp_data = list;

            var colors = ["red", "blue", "orange", "brown", "pink", "gray", "black", "grey"];

            layout = {
                title: "{0} size={1}".format(data_name, size),
                margin: {
                    b: 50,
                    t: 50
                },
                width: 700,
                showlegend: true,
            };
            for (var i = 0; i < sub_names.length; i++) {
                layout["xaxis" + (i+1)] = {anchor: 'y' + (i+1)};
                layout["yaxis" + (i+1)] = {domain: [i * 1.0 / sub_names.length, (i+1) * 1.0 / sub_names.length-0.05],
                                           "title": sub_names[i]};
            }
            list["xaxis"] = 'x' + (canvas_id + 1)
            list["yaxis"] = 'y' + (canvas_id + 1)
            list.marker = {color: colors[plot_data.length % 8]}

            var curve_ins = '<div><input type="checkbox" class="checked" style="display: block" checked value="{0}"/>{1}</div>'.format(plot_data.length, file_path);
            var color_ins = '<span style="float: left">color: <input class="colors" style="display: block" type="text"/></span>';
            var style_ins = '<span>style: <input class="styles" style="display: block" type="text" placeholder="solid, dot, dash, longdash, dashdot"/></span>';
            var new_curve = '<div class="col-md-12">{0}{1}{2}</div>'.format(curve_ins, color_ins, style_ins);
            $(".curves").append(new_curve);
            save_names();
            plot_data.push(list);
            plot_curves(contain_flag);
        }
    });
}

function plot_curves(contain_flag) {
    var canvas = $("div.vis_canvas").children("div.canvas");
    var lines = [];
    var checked = $(".checked");
    var styles = $(".styles");
    var colors = $(".colors");
    for (var i in checked) {
        if (styles[i].value) {
            plot_data[i].line = {dash: styles[i].value};
        }
        if (colors[i].value) {
            plot_data[i].marker = {color: colors[i].value};
        }
        if (checked[i].checked) {
            lines.push(plot_data[i]);
        }
    }

    if (contain_flag == false) {
        Plotly.newPlot(canvas[0], lines, layout, {editable: true});
    } else {
        Plotly.purge(canvas[0]);
        Plotly.plot(canvas[0], lines, layout, {editable: true});
    }
}

function update_chart() {
    plot_curves(false);
}

function remove_chart() {
    var canvas = $("div.vis_canvas").children("div.canvas");
    plot_data = [];
    sub_names = [];
    group_color = {};
    groups = [];
    $(".curves").empty();
    Plotly.purge(canvas[0]);
}

function save_names() {
    var curves = $(".checked");
    var styles = $(".styles");
    var colors = $(".colors");
    var file_list = [];
    for (var i = 0; i < curves.length; i++) {
        var file_path = $(curves[i]).parent().text();
        var style = styles[i].value;
        var color = colors[i].value;
        file_list.push([file_path, color, style]);
    }
    var data = JSON.stringify(file_list);
    var bb = new Blob([data], {type: MIME_TYPE});
    var MIME_TYPE = "application/json";
    a = document.getElementById("download")
    a.download = "file_list.json";
    a.href = window.URL.createObjectURL(bb);
    a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
}

function load_list(files) {
    console.log("load list");
    var reader = new FileReader();
    reader.onload = function (event) {
        var content = event.target.result;
        var data = JSON.parse(content);
        load_file(data, 0);
    }
    reader.readAsText(files[0]);
}

function load_file(f_list, index) {
    if (i >= f_list.length) {
        return;
    }
    var file_path = f_list[index][0];
    var file_name = file_path.split("/")[file_path.split("/").length-1];
    var file_parts = file_name.split("_")
    var metric = ""
    var contain_flag = false;
    var canvas_id = 0;
    for (var i = 0; i < 2; i++) {
        if (file_parts[i] == "")
            continue;
        var prefix = file_parts[i].substring(0, 3);
        if (prefix == "val" || prefix == "tes" || prefix == "tra" || prefix == "de" || prefix == "ste" || prefix == "par") {
            continue;
        }
        metric = file_parts[i];
        for (var j = 0; j < sub_names.length; j++) {
            if (sub_names[j] == metric) {
                contain_flag = true;
                canvas_id = j;
                break;
            }
        }
        if (contain_flag == false) {
            canvas_id = sub_names.length;
            sub_names.push(metric);
        }
    }

    $.ajax({
        method: "post",
        url : "/get_result_array",
        contentType: 'application/json',
        dataType: "json",
        async:false,
        data: JSON.stringify({"file": file_path}),
        success : function (data){
            var list = data.data;
            global_temp_data = list;

            layout = {
                title: "place holder",
                margin: {
                    b: 50,
                    t: 50
                },
                showlegend: true,
            };
            for (var i = 0; i < sub_names.length; i++) {
                layout["xaxis" + (i+1)] = {anchor: 'y' + (i+1)};
                layout["yaxis" + (i+1)] = {domain: [i * 1.0 / sub_names.length, (i+1) * 1.0 / sub_names.length-0.05],
                    "title": sub_names[i]};
            }
            list["xaxis"] = 'x' + (canvas_id + 1)
            list["yaxis"] = 'y' + (canvas_id + 1)
            var colors = ["red", "blue", "orange", "brown", "pink", "gray", "black", "grey"];
            if (f_list[index][1]) {
                list.marker = {color: f_list[index][1]};
            }
            else {
                list.marker = {color: colors[plot_data.length % 8]};
            }
            if (f_list[index][1]) {
                list.line = {dash: f_list[index][2]};
            }

            var curve_ins = '<div><input type="checkbox" class="checked" style="display: block" checked value="{0}"/>{1}</div>'.format(plot_data.length, file_path);
            var color_ins = '<span style="float: left">color: <input class="colors" style="display: block" type="text" value="{0}"/></span>'.format(f_list[index][1]);
            var style_ins = '<span>style: <input class="styles" style="display: block" type="text" value="{0}" placeholder="solid, dot, dash, longdash, dashdot"/></span>'.format(f_list[index][2]);
            var new_curve = '<div class="col-md-12">{0}{1}{2}</div>'.format(curve_ins, color_ins, style_ins);
            $(".curves").append(new_curve);
            save_names();
            plot_data.push(list);
            plot_curves(contain_flag);

            // var canvas = $("div.vis_canvas").children("div.canvas");
            // var new_curve = '<div class="btn btn-default col-md-12"><input type="checkbox" checked value="{0}"/>{1}</div>'.format(plot_data.length, file_path);
            // $(".curves").append(new_curve);
            // save_names();
            // plot_data.push(list);
            // if (contain_flag == false) {
            //     Plotly.newPlot(canvas[0], plot_data, layout, {editable: true});
            // } else {
            //     var temp = plot_data[plot_data.length - 1];
            //     Plotly.purge(canvas[0]);
            //     Plotly.plot(canvas[0], plot_data, layout, {editable: true});
            // }
            load_file(f_list, index+1)
        }
    });

}

function realtime_query() {
    $.ajax({
        method: "post",
        url : "/realtime_query",
        contentType: 'application/json',
        dataType: "json",
        success : function (data){
            var set = data.data;
            var interval = data.x;
            real_time_data = data;
            console.log(set);
            var r_plot_data = [];
            for (var ele in set) {
                var exps = set[ele];
                for (var i in exps) {
                }
            }
        }
    });
}