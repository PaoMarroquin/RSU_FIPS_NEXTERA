(function ($) {
    'use strict';

    var ejesSubitems = {};
    var loaded = false;

    function fetchEjes() {
        $.get('/api/v1/ejes-rsu/', function (data) {
            data.forEach(function (eje) {
                ejesSubitems[eje.id] = eje.subitems;
            });
            loaded = true;
            applyFilter();
        });
    }

    function selectedEjeId() {
        return parseInt($('#id_eje_rsu').val(), 10) || null;
    }

    function buildOptions(subitems, currentVal) {
        var html = '<option value="">---------</option>';
        (subitems || []).forEach(function (s) {
            var sel = (String(s.id) === String(currentVal)) ? ' selected' : '';
            html += '<option value="' + s.id + '"' + sel + '>' + s.nombre + '</option>';
        });
        return html;
    }

    function applyFilter() {
        if (!loaded) return;
        var ejeId = selectedEjeId();
        var subitems = ejeId ? (ejesSubitems[ejeId] || []) : [];
        $('select[name$="-sub_eje"]').each(function () {
            var prev = $(this).val();
            $(this).html(buildOptions(subitems, prev));
        });
    }

    $(document).ready(function () {
        fetchEjes();
        $('#id_eje_rsu').on('change', applyFilter);
        $(document).on('formset:added', applyFilter);
    });

}(django.jQuery));
