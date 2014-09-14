/**
 * Created by bruno on 13/09/2014.
 */

var celestial_bodies = [
    {"name":"Kerbin", "mu":3.5316e12, "radius":600e3, "soi":84159286, "rotation_period":21600},
    {"name":"Mun", "mu":65138398000, "radius":200e3, "soi":2429559.1, "rotation_period":138984.38}];

$(document).ready(function() {
    updateCelestialBody("Kerbin");
    updateOrbitFromAltitude();
});

$('a[rel=\"external\"]').click(function() {
    window.open($(this).attr('href'));
    return false;
});

$('#celestial_body_selector a').click(function() {
    var celestial_body_name = $(this).html();
    updateCelestialBody(celestial_body_name);
    updateOrbitFromAltitude();
});

$('#altitude_unit_selector a').click(function()  {
    var last_data_altitude_unit = parseFloat($('#altitude_unit').attr('data-altitude-unit'));
    var altitude = parseFloat($('#altitude').val());
    var altitude_unit = $(this).html();
    var data_altitude_unit = parseFloat($(this).parent().data('altitude-unit'));

    altitude *= last_data_altitude_unit / data_altitude_unit;

    $('#altitude').val(altitude.toFixed(0));


    $('#altitude_unit')
        .html(altitude_unit)
        .attr('data-altitude-unit', data_altitude_unit);

    updateOrbitFromAltitude();
});

$('#altitude').change(updateOrbitFromAltitude);

$('#time').change(updateOrbitFromTime);

$('#out_flow_unit_selector a').click(function() {
    var flow_unit = $(this).html();
    var data_flow_unit = parseFloat($(this).parent().data('flow-unit'));

    $('#out_flow_unit')
        .html(flow_unit)
        .attr('data-flow-unit', data_flow_unit);
});

$('#in_flow_unit_selector a').click(function() {
    var flow_unit = $(this).html();
    var data_flow_unit = parseFloat($(this).parent().data('flow-unit'));

    $('#in_flow_unit')
        .html(flow_unit)
        .attr('data-flow-unit', data_flow_unit);
});

$('#out, #in').click(function() {
    var id =  $(this).attr('id');

    var quantity = parseFloat($('#' + id + '_quantity').val());
    var flow = parseFloat($('#' + id + '_flow').val());
    var unit = $('#' + id + '_flow_unit').html();
    var data_unit = parseFloat($('#' + id + '_flow_unit').attr('data-flow-unit'));

    var total_flow = quantity * flow / data_unit;

    var row = $('#row_template').clone();
    row.removeAttr('id');
    row.attr('data-flow', total_flow);


    $('td:nth-child(1)', row).html(quantity);
    $('td:nth-child(2)', row).html(flow + ' ' + unit);
    $('td:nth-child(3)', row).html(total_flow + ' s<sup>-1</sup>');

    $('button', row).click(function() {
        row.remove();
        updateEnergy();
    });

    $('#' + id + '_table tbody').append(row);

    updateEnergy();
});

$('#battery').click(function() {
    var quantity = parseFloat($('#battery_quantity').val());
    var capacity = parseFloat($('#battery_capacity').val());

    var total_battery = quantity * capacity;

    var row = $('#row_template').clone();
    row.removeAttr('id');
    row.attr('data-battery', total_battery);


    $('td:nth-child(1)', row).html(quantity);
    $('td:nth-child(2)', row).html(capacity);
    $('td:nth-child(3)', row).html(total_battery);

    $('button', row).click(function() {
        row.remove();
        updateEnergy();
    });

    $('#battery_table tbody').append(row);

    updateEnergy();
});

function updateOrbitFromAltitude() {
    var altitude = parseFloat($('#altitude').val());
    var altitude_unit = parseFloat($('#altitude_unit').attr('data-altitude-unit'));
    var time = timeFromAltitude(altitude * altitude_unit);
    var dark_ratio = darkRatioFromAltitude(altitude * altitude_unit);
    var dark_time = time * dark_ratio;
    updateOrbit(altitude, time, dark_time);
}

function updateOrbitFromTime() {
    var time = parseFloat($('#time').val());
    var altitude = altitudeFromTime(time);
    var altitude_unit = parseFloat($('#altitude_unit').attr('data-altitude-unit'));
    var dark_ratio = darkRatioFromAltitude(altitude);
    var dark_time = time * dark_ratio;
    updateOrbit(altitude / altitude_unit, time, dark_time);
}

function updateOrbit(altitude, time, dark_time) {
    var percent = dark_time/time*100.0;

    $('#altitude').val(altitude.toFixed(0));
    $('#time').val(time.toFixed(0));
    $('#formated_time').html(formatTime(time));
    $('#dark_time').html(dark_time.toFixed(0));
    $('#formated_dark_time').html(formatTime(dark_time));
    $('#dark_time_percent').html(percent.toFixed(1));
}

function updateCelestialBody(celestial_body_name) {
    $('#celestial_body_name').html(celestial_body_name);

    var celestial_body =  celestial_bodies[0];

    for (var i=0; i < celestial_bodies.length; i++) {
        celestial_body = celestial_bodies[i];
        if (celestial_body.name == celestial_body_name) {
            i=celestial_bodies.length;
        }
    }

    $('#mu').html(celestial_body.mu);
    $('#radius').html(celestial_body.radius);
    $('#soi').html(celestial_body.soi);
    $('#rotation_period').html(celestial_body.rotation_period);
    $('#angular_velocity').html(360/celestial_body.rotation_period);
    $('#formated_rotation_period').html(formatTime(celestial_body.rotation_period));
}

function darkRatioFromAltitude(altitude) {
    var radius = parseFloat($('#radius').html());
    return Math.asin(1.0/(1.0+altitude/radius)) / Math.PI;
}

function timeFromAltitude(altitude) {
    var mu = parseFloat($('#mu').html());
    var radius = parseFloat($('#radius').html());

    return 2.0 * Math.PI * Math.sqrt(Math.pow(altitude + radius, 3) / mu);
}

function altitudeFromTime(time) {
    var mu = parseFloat($('#mu').html());
    var radius = parseFloat($('#radius').html());

    return Math.pow(mu*Math.pow(time/(2.0*Math.PI),2),1.0/3.0) - radius;
}

function formatTime(time) {
    var hours = Math.floor(time/3600);
    var minutes = Math.floor((time/60)%60);
    var secondes = Math.floor(time%60);

    return hours + 'h ' + minutes + 'm ' + secondes + 's';
}

function updateEnergy() {
    var out_total = 0;
    var in_total = 0;
    var balance;
    var battery_total = 0;
    var charge_time;
    var discharge_time;

    $('#out_table tr').each(function () {
        var flow = $( this ).data('flow');
        if (flow === undefined) return;
        out_total += flow;
    });

    $('#in_table tr').each(function () {
        var flow = $( this ).data('flow');
        if (flow === undefined) return;
        in_total += flow;
    });

    $('#battery_table tr').each(function () {
        var battery = $( this ).data('battery');
        if (battery === undefined) return;
        battery_total += battery;
    });

    balance = in_total - out_total;
    charge_time = battery_total / balance;
    discharge_time = battery_total / out_total;

    $('#out_total').html(out_total);
    $('#in_total').html(in_total);
    $('#battery_total').html(battery_total);
    $('#balance').html(balance);
    $('#charge_time').html(charge_time.toFixed(0));
    $('#formated_charge_time').html(formatTime(charge_time));
    $('#discharge_time').html(discharge_time.toFixed(0));
    $('#formated_discharge_time').html(formatTime(discharge_time));
}








