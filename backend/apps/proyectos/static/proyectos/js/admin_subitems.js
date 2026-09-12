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

    function selectedEjeIds() {
        // 'ejes_rsu' es un ManyToMany (selección múltiple de ejes RSU): se
        // muestran los sub-items de todos los ejes seleccionados, no solo
        // uno.
        var val = $('#id_ejes_rsu').val();
        if (!val) return [];
        return [].concat(val).map(function (v) { return parseInt(v, 10); }).filter(Boolean);
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
        var ejeIds = selectedEjeIds();
        var subitems = [];
        ejeIds.forEach(function (ejeId) {
            subitems = subitems.concat(ejesSubitems[ejeId] || []);
        });
        $('select[name$="-sub_eje"]').each(function () {
            var prev = $(this).val();
            $(this).html(buildOptions(subitems, prev));
        });
    }

    $(document).ready(function () {
        fetchEjes();
        $('#id_ejes_rsu').on('change', applyFilter);
        $(document).on('formset:added', applyFilter);
    });

}(django.jQuery));
