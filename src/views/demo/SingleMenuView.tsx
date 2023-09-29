import React, { useEffect, useState, useRef } from 'react'
import $ from 'jquery'
import 'leaflet/dist/leaflet.css'
import './app.css'
import * as L from 'leaflet'
import 'bootstrap-table'
import 'bootstrap-table/dist/bootstrap-table.min.css'
import { Feature, GeoJsonObject, Geometry } from 'geojson'
import 'jQuery-QueryBuilder'
import 'jQuery-QueryBuilder/dist/css/query-builder.default.css'
import alasql from 'alasql'

const urlFormatter = (value: string | string[], row: any, index: any) => {
  if (
    typeof value === 'string' &&
    (value.indexOf('http') === 0 || value.indexOf('https') === 0)
  ) {
    return "<a href='" + value + "' target='_blank'>" + value + '</a>'
  }
}

const config = {
  geojson: '/data/projects.geojson',
  title: '',
  layerName: 'Projects',
  hoverProperty: 'title',
  sortProperty: 'title',
  sortOrder: 'desc',
}

const properties = [
  {
    value: 'id',
    label: 'UID',
    table: {
      visible: false,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
    info: false,
  },
  {
    value: 'title',
    label: 'Title',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
      input: 'checkbox',
      vertical: true,
      multiple: true,
      operators: ['in', 'not_in', 'equal', 'not_equal'],
      values: [],
    },
  },
  {
    value: 'subtitle',
    label: 'Address',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
      input: 'checkbox',
      vertical: true,
      multiple: true,
      operators: ['in', 'not_in', 'equal', 'not_equal'],
      values: [],
    },
  },
  {
    value: 'description',
    label: 'Description',
    table: {
      visible: false,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
  },
  {
    value: 'tags',
    label: 'Tags',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
  },
  {
    value: 'createdby',
    label: 'Created By',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
  },
  {
    value: 'organisation',
    label: 'Organisation',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
  },
  {
    value: 'lat',
    label: 'Latitude',
    table: {
      visible: true,
      sortable: true,
    },
    filter: {
      type: 'string',
      input: 'radio',
      operators: ['equal'],
      values: {
        yes: 'Yes',
        no: 'No',
      },
    },
  },
  {
    value: 'lng',
    label: 'Long',
    table: {
      visible: false,
      sortable: true,
    },
    filter: {
      type: 'string',
    },
  },
  {
    value: 'created_at',
    label: 'Created',
    table: {
      visible: true,
      sortable: true,
      formatter: urlFormatter,
    },
    filter: false,
  },
]

export const useEffectOnce = (effect: any) => {
  const destroyFunc = useRef()
  const effectCalled = useRef(false)
  const renderAfterCalled = useRef(false)
  const [val, setVal] = useState(0)

  if (effectCalled.current) {
    renderAfterCalled.current = true
  }

  useEffect(() => {
    // only execute the effect first time around
    if (!effectCalled.current) {
      destroyFunc.current = effect()
      effectCalled.current = true
    }

    // this forces one render after the effect is run
    setVal((val) => val + 1)

    return () => {
      // if the comp didn't render since the useEffect was called,
      // we know it's the dummy React cycle
      if (!renderAfterCalled.current) {
        return
      }
      if (destroyFunc.current) {
        destroyFunc.current()
      }
    }
  }, [])
}

/** Example purpose only */
function SingleMenuView() {
  let map: L.Map | L.LayerGroup<any>

  let markerColor

  let geojson: { features: any }

  const mapboxOSM = L.tileLayer(
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY3Jpc3BhZXJpYWwiLCJhIjoiY2p3M2Jocmw2MGV6eTQ0azNsZTZnMmNmbyJ9.QR6i6106sQVeLmckTrWFdQ',
    {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c', 'd'],
      attribution:
        'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>',
    }
  )

  const highlightLayer = L.geoJson(undefined, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 5,
        color: '#FFF',
        weight: 2,
        opacity: 1,
        fillColor: '#00FFFF',
        fillOpacity: 1,
      })
    },
    style: function (feature) {
      return {
        color: '#00FFFF',
        weight: 2,
        opacity: 1,
        fillColor: '#00FFFF',
        fillOpacity: 0.5,
        clickable: false,
      }
    },
  })

  const featureLayer = L.geoJson(undefined, {
    filter: function (geoJsonFeature: Feature<Geometry, any>) {
      return (
        geoJsonFeature.geometry.coordinates[0] !== 0 &&
        geoJsonFeature.geometry.coordinates[1] !== 0
      )
    },
    pointToLayer: function (feature, latlng) {
      if (feature.properties && feature.properties['marker-color']) {
        markerColor = feature.properties['marker-color']
      } else {
        markerColor = '#FF0000'
      }
      return L.circleMarker(latlng, {
        radius: 4,
        weight: 2,
        fillColor: markerColor,
        color: markerColor,
        opacity: 1,
        fillOpacity: 1,
      })
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties) {
        layer.on({
          click: function () {
            identifyFeature(L.stamp(layer))
            highlightLayer.clearLayers()
            const geoJSONLayer = layer as L.GeoJSON
            highlightLayer.addData(geoJSONLayer.toGeoJSON())
          },
          mouseover: function (e) {
            if (config.hoverProperty) {
              $('.info-control').html(feature.properties[config.hoverProperty])
              $('.info-control').show()
            }
          },
          mouseout: function (e) {
            $('.info-control').hide()
          },
        })
      }
    },
  })

  const customAddInfo = (map: L.Map) => {
    let isCollapsed = false
    let info = L.control({
      position: 'bottomleft',
    })

    // Custom info hover control
    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info-control')
      this.update()
      return this._div
    }
    info.update = function (props: any) {
      this._div.innerHTML = ''
    }

    info.addTo(map)

    $('.info-control').hide()

    // Larger screens get expanded layer control
    if (document.body.clientWidth <= 767) {
      isCollapsed = true
    } else {
      isCollapsed = false
    }
    let baseLayers = {
      'Street Map': mapboxOSM,
      // "Aerial Imagery": mapboxSat
    }
    let overlayLayers = {
      "<span id='layer-name'>GeoJSON Layer</span>": featureLayer,
    }
    let layerControl = L.control
      .layers(baseLayers, overlayLayers, {
        collapsed: isCollapsed,
      })
      .addTo(map)
  }

  useEffectOnce(() => {
    // Initialize the map once the component is mounted

    map = L.map('map', {
      layers: [mapboxOSM, featureLayer, highlightLayer],
    }).fitWorld()

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors',
    }).addTo(map)

    $.getJSON(config.geojson, function (data) {
      geojson = data
      let features = $.map(geojson.features, function (feature) {
        return feature.properties
      })
      featureLayer.addData(data)
      $('#loading-mask').hide()
      buildConfig()
    })

    map.on('moveend', function () {
      syncTable()
    })

    map.on('click', function (_e) {
      highlightLayer.clearLayers()
    })
    customAddInfo(map)

    map.addControl(new customControl())
    map.addControl(new customControl2())

    $('.title').html(config.title)
    $('#layer-name').html(config.layerName)

    // Clean up the map when the component is unmounted
    return () => {
      map?.remove()
      map.off('moveend')
      map.off('click')
    }
  }, [])

  const syncTable = () => {
    let tableFeatures: any[] = []
    featureLayer.eachLayer(function (layer) {
      layer.feature.properties.leaflet_stamp = L.stamp(layer)
      if (map.hasLayer(featureLayer)) {
        if (layer.getLatLng && map.getBounds().contains(layer.getLatLng())) {
          tableFeatures.push(layer.feature.properties)
        } else if (
          layer.getBounds &&
          map.getBounds().intersects(layer.getBounds())
        ) {
          tableFeatures.push(layer.feature.properties)
        }
      }
    })

    // setTableData1(tableFeatures)

    $('#table').bootstrapTable(
      'load',
      JSON.parse(JSON.stringify(tableFeatures))
    )

    // let featureCount = tableFeatures.length
    let featureCount = $('#table').bootstrapTable('getData').length
    // document.getElementById("table").style.display = 'block';
    if (featureCount == 1) {
      document.getElementById('feature-count').innerHTML =
        featureCount + ' visible feature'
    } else {
      document.getElementById('feature-count').innerHTML =
        featureCount + ' visible features'
    }
  }

  const openFilterModal = (state: boolean) => {
    $(document).ready(function () {
      if (state === true) {
        $('#filterModal').addClass(' show')
        $('#filterModal').slideToggle('slow')
      } else if (state === false) {
        $('#filterModal').slideToggle('slow')
      }
    })
    // setIsOpen(state)
  }

  const applyFilter = () => {
    var query = 'SELECT * FROM ?'
    let QueryBuilderElement = document.getElementById('query-builder')
    if (QueryBuilderElement)
      var sql = $(QueryBuilderElement).queryBuilder('getSQL', false, false).sql
    if (sql.length > 0) {
      query += ' WHERE ' + sql
    }
    alasql(query, [geojson.features], function (features: GeoJsonObject) {
      featureLayer.clearLayers()
      featureLayer.addData(features)
      syncTable()
    })
  }

  $('#view-sql-btn').click(function () {
    alert($('#query-builder').queryBuilder('getSQL', false, false).sql)
  })

  $('#apply-filter-btn').click(function () {
    applyFilter()
  })

  $('#reset-filter-btn').click(function () {
    $('#query-builder').queryBuilder('reset')
    applyFilter()
  })

  $('#extent-btn').click(function () {
    map.fitBounds(featureLayer.getBounds())
    $('.navbar-collapse.in').collapse('hide')
    return false
  })

  $('#download-csv-btn').click(function () {
    $('#table').tableExport({
      type: 'csv',
      ignoreColumn: [0],
      fileName: 'data',
    })
    $('.navbar-collapse.in').collapse('hide')
    return false
  })

  $('#download-excel-btn').click(function () {
    $('#table').tableExport({
      type: 'excel',
      ignoreColumn: [0],
      fileName: 'data',
    })
    $('.navbar-collapse.in').collapse('hide')
    return false
  })

  $('#download-pdf-btn').click(function () {
    $('#table').tableExport({
      type: 'pdf',
      ignoreColumn: [0],
      fileName: 'data',
      jspdf: {
        format: 'bestfit',
        margins: {
          left: 20,
          right: 10,
          top: 20,
          bottom: 20,
        },
        autotable: {
          extendWidth: false,
          overflow: 'linebreak',
        },
      },
    })
    $('.navbar-collapse.in').collapse('hide')
    return false
  })

  const buildConfig = () => {
    let filters: { id: string; label: string }[] = []
    let table = [
      {
        field: 'action',
        title: '<i class="fa fa-cog"></i> Action',
        align: 'center',
        valign: 'middle',
        width: '75px',
        cardVisible: false,
        switchable: false,
        formatter: function (value: any, row: any, index: any) {
          return [
            '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px; color: #0d6efd;">',
            '<i class="fa fa-search-plus"></i>',
            '</a>' +
              '<a class="identify" href="javascript:void(0)" title="Identify" style="color: #0d6efd">',
            '<i class="fa fa-info-circle"></i>',
            '</a>',
          ].join('')
        },
        events: {
          'click .zoom': function (
            e: any,
            value: any,
            row: { leaflet_stamp: number },
            index: any
          ) {
            let targetLayer = featureLayer.getLayer(row.leaflet_stamp)

            if (targetLayer.getLatLng) {
              map.setView(targetLayer.getLatLng(), 24) // desiredZoomLevel is whatever zoom level you want, e.g., 14
            }
            // If it's a polygon, polyline, or another shape
            else if (targetLayer.getBounds) {
              map.fitBounds(targetLayer.getBounds())
            }

            highlightLayer.clearLayers()
            highlightLayer.addData(targetLayer.toGeoJSON())
          },
          'click .identify': function (
            e: any,
            value: any,
            row: { leaflet_stamp: number },
            index: any
          ) {
            identifyFeature(row.leaflet_stamp)
            highlightLayer.clearLayers()
            highlightLayer.addData(
              featureLayer.getLayer(row.leaflet_stamp)?.toGeoJSON()
            )
          },
        },
      },
    ]

    $.each(properties, function (index, value) {
      // Filter config
      if (value.filter) {
        var id
        if (value.filter.type == 'integer') {
          id = 'cast(properties->' + value.value + ' as int)'
        } else if (value.filter.type == 'double') {
          id = 'cast(properties->' + value.value + ' as double)'
        } else {
          id = 'properties->' + value.value
        }
        filters.push({
          id: id,
          label: value.label,
        })
        $.each(value.filter, function (key, val) {
          if (filters[index]) {
            // If values array is empty, fetch all distinct values
            if (key == 'values' && val.length === 0) {
              let distinctValues: any[] = []
              alasql(
                'SELECT DISTINCT(properties->' +
                  value.value +
                  ') AS field FROM ? ORDER BY field ASC',
                [geojson.features],
                function (results) {
                  $.each(results, function (index, value) {
                    distinctValues.push(value.field)
                  })
                }
              )
              filters[index].values = distinctValues
            } else {
              filters[index][key] = val
            }
          }
        })
      }
      // Table config
      if (value.table) {
        table.push({
          field: value.value,
          title: value.label,
        })
        $.each(value.table, function (key, val) {
          if (table[index + 1]) {
            table[index + 1][key] = val
          }
        })
      }
    })

    $(document).ready(function () {
      $('#query-builder').queryBuilder({
        allowEmpty: true,
        filters: filters,
      })
    })

    buildTable(table)
  }

  const buildTable = (table: any[]) => {
    $('#table').bootstrapTable({
      cache: false,
      height: $('#table-container').height(),
      undefinedText: '',
      pagination: false,
      minimumCountColumns: 1,
      sortName: config.sortProperty,
      sortOrder: config.sortOrder,
      toolbar: '#toolbar',
      search: true,
      trimOnSearch: false,
      showColumns: true,
      showToggle: true,
      columns: table,
      onClickRow: function (row) {},
      onDblClickRow: function (row) {
        let targetLayer = featureLayer.getLayer(row.leaflet_stamp)

        if (targetLayer.getLatLng) {
          map.setView(targetLayer.getLatLng(), 24)
        } else if (targetLayer.getBounds) {
          map.fitBounds(targetLayer.getBounds())
        }

        highlightLayer.clearLayers()
        highlightLayer.addData(targetLayer.toGeoJSON())

        identifyFeature(row.leaflet_stamp)
        highlightLayer.clearLayers()
        highlightLayer.addData(
          featureLayer.getLayer(row.leaflet_stamp).toGeoJSON()
        )
      },
    })

    map.fitBounds(featureLayer.getBounds())

    $(window).resize(function () {
      $('#table').bootstrapTable('resetView', {
        height: $('#table-container').height(),
      })
    })
  }

  const identifyFeature = (id: any) => {
    let featureProperties = featureLayer.getLayer(id)?.feature.properties
    let content =
      "<table class='table table-striped table-bordered table-condensed'>"
    $.each(featureProperties, function (key, value) {
      if (!value) {
        value = ''
      }
      if (
        typeof value == 'string' &&
        (value.indexOf('http') === 0 || value.indexOf('https') === 0)
      ) {
        value = "<a href='" + value + "' target='_blank'>" + value + '</a>'
      }
      $.each(properties, function (index, property) {
        if (key == property.value) {
          if (property.info !== false) {
            content +=
              '<tr><th>' + property.label + '</th><td>' + value + '</td></tr>'
          }
        }
      })
    })
    content += '<table>'
    $('#feature-info').html(content)
    $('#featureModal').addClass(' show')
    $('#featureModal').slideToggle('slow')
  }

  function switchView(view: string) {
    if (view == 'split') {
      $('#view').html('Split View')
      location.hash = '#split'
      $('#table-container').show()
      $('#table-container').css('height', '55%')
      $('#map-container').show()
      $('#map-container').css('height', '45%')
      $(window).resize()
      if (map) {
        map.invalidateSize()
      }
    } else if (view == 'map') {
      $('#view').html('Map View')
      location.hash = '#map'
      $('#map-container').show()
      $('#map-container').css({
        height: '100%',
      })

      $('#table-container').hide()
      if (map) {
        map.invalidateSize()
      }
    } else if (view == 'table') {
      $('#view').html('Table View')
      location.hash = '#table'
      $('#table-container').show()
      $('#table-container').css('height', '100%')
      $('#map-container').hide()
      $(window).resize()
    }
  }

  $("[title='view']").click(function () {
    $('.in,.open').removeClass('in open')
    if (this.id === 'map-graph') {
      switchView('split')
      return false
    } else if (this.id === 'map-only') {
      switchView('map')
      return false
    } else if (this.id === 'graph-only') {
      switchView('table')
      return false
    }
  })

  const customControl = L.Control.extend({
    options: {
      position: 'topright', // Adjust the position as needed
    },
    onAdd: function (map: any) {
      var container = L.DomUtil.create('div', 'custom-button')
      container.innerHTML = '<i class="fa fa-expand"></i>'
      container.onclick = function () {
        // Define your button click behavior here
        // alert('Button clicked!');
        map.fitBounds(featureLayer.getBounds())
        $('.navbar-collapse.in').hide('fast')
        return false
      }
      return container
    },
  })

  const customControl2 = L.Control.extend({
    options: {
      position: 'topright', // Adjust the position as needed
    },
    onAdd: function (map: any) {
      var container = L.DomUtil.create('div', 'custom-button')
      container.innerHTML = '<i class="fa fa-filter"></i> '
      container.onclick = function () {
        // Define your button click behavior here

        $('#filterModal').addClass(' show')
        $('#filterModal').slideToggle('slow')
        $('.navbar-collapse.in').slideToggle('slow')
        return false
      }
      return container
    },
  })

  return (
    <>
      <div id="loading-mask" className="modal-backdrop">
        <div className="loading-indicator">
          <div className="progress progress-striped active">
            <div className="progress-bar progress-bar-info loading-bar"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-2 p-2 text-4">
        <a
          id="extent-btn"
          href="#"
          data-toggle="collapse"
          data-target=".navbar-collapse.in"
        >
          <i className="fa fa-arrows-alt fa-white"></i> Feature Extent
        </a>

        <a
          href="#"
          data-toggle="collapse"
          data-target=".navbar-collapse.in"
          title="view"
          id="map-graph"
        >
          <i className="fa fa-th-large"></i> Split View
        </a>
        <a
          href="#"
          data-toggle="collapse"
          data-target=".navbar-collapse.in"
          title="view"
          id="map-only"
        >
          <i className="fa fa-globe"></i> Map View
        </a>
        <a
          href="#"
          data-toggle="collapse"
          data-target=".navbar-collapse.in"
          title="view"
          id="graph-only"
        >
          <i className="fa fa-table"></i> Table View
        </a>
      </div>
      <div id="map-container">
        <div id="map"></div>
      </div>
      <div id="table-container">
        <div
          id="toolbar"
          className="w-[100%] flex flex-row justify-between items-center p-1"
        >
          <div>
            <div className="btn-group" role="group">
              <button
                id="filter-btn"
                type="button"
                className="btn btn-default"
                data-toggle="modal"
                data-target="#filterModal"
                onClick={() => openFilterModal(true)}
              >
                <i className="fa fa-filter"></i> Filter Data
              </button>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-default dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="true"
                >
                  <i className="fa fa-download"></i> Export Data
                  <span className="caret"></span>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#" id="download-csv-btn">
                      <i className="fa fa-file-csv"></i> CSV
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      id="download-excel-btn"
                    >
                      <i className="fa fa-file-excel"></i> Excel
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" id="download-pdf-btn">
                      <i className="fa fa-file-pdf"></i> PDF
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <span
              id="feature-count"
              className="text-muted"
              style={{ paddingLeft: '15px' }}
            ></span>
          </div>
        </div>
        <table id="table"></table>
      </div>

      <div
        className="modal fade"
        id="filterModal"
        tabIndex={-1}
        role="dialog"
        aria-hidden={true}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                Filter Data
                <span
                  id="record-count"
                  className="badge pull-right"
                  style={{ marginRight: '15px', marginTop: '2px' }}
                ></span>
              </h4>
              <button
                type="button"
                className="btn btn-default pull-left"
                onClick={() => openFilterModal(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div id="query-builder"></div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-default pull-left"
                id="view-sql-btn"
              >
                <i className="fa fa-database"></i> SQL
              </button>
              <button
                type="button"
                className="btn btn-info bg-[#0dcaf0]"
                id="reset-filter-btn"
              >
                <i className="fa fa-undo"></i> Reset Filter
              </button>
              <button
                type="button"
                className="btn btn-primary bg-[#0b5ed7]"
                id="apply-filter-btn"
              >
                <i className="fa fa-filter"></i> Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade modal-md"
        id="featureModal"
        tabIndex={-1}
        role="dialog"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Project Info</h4>
              <button
                className="btn-close"
                type="button"
                data-bs-dismiss="modal"
                aria-hidden="true"
              ></button>
            </div>
            <div className="modal-body" id="feature-info"></div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary bg-gray-500"
                data-bs-dismiss="modal"
                onClick={() => {
                  $('#featureModal').slideToggle('slow')
                }}
              >
                Close
              </button>
              <button type="button" className="btn btn-primary bg-blue-800">
                Launch Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SingleMenuView
