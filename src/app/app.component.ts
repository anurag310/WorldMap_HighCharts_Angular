import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_map from 'highcharts/modules/map';

HC_map(Highcharts);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  chart: any;

  ngAfterViewInit(): void {
    this.chart = (Highcharts.mapChart as any)(this.chartContainer.nativeElement, {
      chart: {
        type: 'map',
        events: {
          drilldown: this.drilldown.bind(this),
          drillup: this.afterDrillUp.bind(this)
        }
      },
      title: {
        text: 'World Map'
      },
      colorAxis: {
        min: 0,
        minColor: '#E6E7E8',
        maxColor: '#005645'
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      plotOptions: {
        map: {
          states: {
            hover: {
              color: '#EEDD66'
            }
          },
          point: {
            events: {
              click: this.pointClick.bind(this) // Handle point click events
            }
          }
        }
      },
      series: [
        {
          data: [], // Initialize with empty data
          name: 'World',
          dataLabels: {
            enabled: true,
            format: '{point.name}'
          }
        }
      ],
      drilldown: {
        activeDataLabelStyle: {
          color: '#FFFFFF',
          textDecoration: 'none',
          textOutline: '1px #000000'
        }
      }
    });

    this.loadWorldMap();
  }

  loadWorldMap() {
    fetch('https://code.highcharts.com/mapdata/custom/world.geo.json')
      .then((response) => response.json())
      .then((worldData) => {
        this.chart.showLoading('Loading world map...');
        this.chart.hideLoading();
        this.chart.addSeries({
          type: 'map',
          name: 'World',
          data: Highcharts.geojson(worldData),
        });
      });
  }

  drilldown(e: any) {
    if (!e.seriesOptions) {
      const chart = this.chart;
      const countryCode = e.point.properties['iso-a2'].toLowerCase();

      chart.showLoading(`Loading map for ${e.point.name}...`);

      fetch(`https://code.highcharts.com/mapdata/countries/${countryCode}/${countryCode}-all.geo.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch map data for ${e.point.name}. Status: ${response.status}`);
          }
          return response.json();
        })
        .then((countryData) => {
          // Destroy the existing chart to remove the old map
          chart.destroy();

          // Create a new chart with the selected country map
          this.chart = (Highcharts.mapChart as any)(this.chartContainer.nativeElement, {
            chart: {
              type: 'map',
              events: {
                drilldown: this.drilldown.bind(this),
                drillup: this.afterDrillUp.bind(this)
              }
            },
            title: {
              text: `Map of ${e.point.name}`
            },
            // ... (other chart options)

            series: [
              {
                type: 'map',
                name: e.point.name,
                data: Highcharts.geojson(countryData),
                joinBy: 'hc-key',
                
                keys: ['hc-key', 'value'], // Assuming you have state data as 'hc-key' and 'value'
                tooltip: {
                  headerFormat: '',
                  pointFormat: '{point.name}: {point.value}'
                }
              }
            ],
            // ... (other chart options)
          });

          // Set the current drilldown level
          chart.currentDrilldown = e.point;

          chart.hideLoading();
        })
        .catch((error) => {
          chart.hideLoading();
          console.error(error);
        });
    }
  }

  afterDrillUp(e: any) {
    const chart = this.chart;
    if (e.seriesOptions) {
      chart.destroy();
      this.loadWorldMap();
    }
  }

  pointClick(e: any) {
    this.drilldown({
      target: e.target,
      point: e.point
    });
  }
}
