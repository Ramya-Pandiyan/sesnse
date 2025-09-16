import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, HostListener, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SubmissionService } from '../../core/services/submission.service';
import { SubmissionDetail, ChatMessage } from '../../data/model/submission.model';
import { NotificationService } from '../../core/services/notification.service';
import { ChatInterfaceComponent } from '../../shared/chat-interface/chat-interface.component';
import { EmailPreviewModalComponent } from '../../shared/email-preview-modal/email-preview-modal.component';
import { Common } from '../../shared/common/common.service';
import { MarkdownParserComponent } from '../../shared/markdown-parser/markdown-parser.component';
import { NotesPanelComponent } from '../../shared/notes-panel/notes-panel.component';
import { RightSidebarComponent } from '../../shared/right-sidebar/right-sidebar.component';
import { RightPanelComponent } from '../../shared/right-panel/right-panel.component';
import { PdfPreviewComponent } from '../../shared/pdf-preview/pdf-preview.component';

Chart.register(...registerables);

interface FollowUpQuestion {
  id: number;
  text: string;
}

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RightSidebarComponent, ChatInterfaceComponent, EmailPreviewModalComponent, MarkdownParserComponent, NotesPanelComponent, RightPanelComponent, PdfPreviewComponent],
  templateUrl: './submission-detail.component.html',
  styleUrl: './submission-detail.component.scss'
})
export class SubmissionDetailComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild('coverageChart') coverageChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('occupancyChart') occupancyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('constructionChart') constructionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearBuiltChart') yearBuiltChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lossRunChart') lossRunChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('catVsAttritionalChart') catVsAttritionalChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lossCauseChart') lossCauseChartRef!: ElementRef<HTMLCanvasElement>;

  showRightSidebar: boolean = true;
  submissionDetail: any | null = null;
  isLoading = false;
  showEmailModal = false;
  submissionId = '';
  maxBullets = 0;
  isAnalysisSummaryExpanded = true;
  expandedAccordions: { [key: string]: boolean } = {
    'risk-signals': true,
    'market-intelligence': false
  };


  activeTab = 'overview';
  activeSubTab: string = 'narrative';

  lossRunActiveSubTab: string = 'lrnarrative';


  private destroy$ = new Subject<void>();
  private charts: Chart[] = [];

  tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'assets/icons/overview.svg',
      iconActive: 'assets/icons/mail-icon.svg'
    },
    {
      id: 'exposure-details',
      label: 'Exposure Details',
      icon: 'assets/icons/underwriting.svg',
      iconActive: 'assets/icons/underwriting copy.svg'
    },
    {
      id: 'loss-run',
      label: 'Loss Run',
      icon: 'assets/icons/lossrun.svg',
      iconActive: 'assets/icons/lossrun copy.svg'
    }, {
      id: 'insured',
      label: 'Insured',
      icon: 'assets/icons/insured-operations-icon.svg',
      iconActive: 'assets/icons/insured-operations-icon copy.svg'
    },
    {
      id: 'missing-info',
      label: 'Missing Info',
      icon: 'assets/icons/alert.svg',
      iconActive: 'assets/icons/alert copy.svg'
    }
  ];

  chartColors = [
    '#3b83f68d', '#10b98193', '#f59f0b80', '#ef444488', '#8a5cf68b',
    '#06b5d48b', '#83cc1689', '#f9741693', '#ec489a8f', '#6365f18f'
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private submissionService: SubmissionService,
    private notificationService: NotificationService,
    private commonService: Common,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.submissionId = params['id'];
      this.loadSubmissionDetail(this.submissionId);
    });
  }

  ngAfterViewInit(): void {
    if (this.submissionDetail) {
      console.log(this.submissionDetail.nativeElement);
    } else {
      console.warn('submissionDetail is undefined!');
    }

    this.selectableArea.nativeElement.addEventListener('mouseup', (event: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        if (this.selectableArea.nativeElement.contains(selection.anchorNode)) {
          this.selectionText = selection.toString();
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          this.menuPosition = {
            x: rect.right + window.scrollX,
            y: rect.top + window.scrollY - 40
          };
          return;
        }
      }
      this.selectionText = '';
    });
  }


  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'exposure-details') {
      this.activeSubTab = 'narrative';
    } else if (tabId === 'loss-run') {
      this.lossRunActiveSubTab = 'lrnarrative';
    }
  }

  setActiveSubTab(tab: string): void {
    this.activeSubTab = tab;
    if (tab === 'visuals' && this.activeTab === 'exposure-details') {
      setTimeout(() => {
        this.createPieCharts();
      }, 50);
    }
  }

  setLossRunActiveSubTab(tab: string): void {
    this.lossRunActiveSubTab = tab;

    if (tab === 'lrvisuals' && this.activeTab === 'loss-run') {
      setTimeout(() => {
        this.createLossRunChart();
        this.createLossRunPieCharts();
      }, 50);
    }
  }

  private loadSubmissionDetail(submissionId: string): void {
    if (!submissionId) return;

    this.isLoading = true;

    this.submissionService.getSubmissionInsights(submissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.submissionDetail = response?.insights[0];

          setTimeout(() => {
            if (this.activeSubTab === 'visuals' || this.lossRunActiveSubTab === 'lrvisuals') {
              this.createCharts();
            }
          }, 100);

          setTimeout(() => {
            this.createLossRunPieCharts();
          }, 0);
        },
        error: (err) => {
          console.error('Failed to load submission details:', err);
          this.submissionDetail = null;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private createCharts(): void {
    console.log('Creating charts for active tab:', this.activeTab);
    console.log('Active sub-tab:', this.activeSubTab);
    console.log('Loss run sub-tab:', this.lossRunActiveSubTab);

    this.destroyCharts();

    if (this.activeTab === 'exposure-details' && this.activeSubTab === 'visuals') {
      this.createPieCharts();
    } else if (this.activeTab === 'loss-run' && this.lossRunActiveSubTab === 'lrvisuals') {
      this.createLossRunChart();
      this.createLossRunPieCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLossRunChart(): void {
    const lr = {
      "loss_run": [
        {
          "loss_profile": {
            "years_loss_run_provided": {
              "value": 2,
              "color": "red"
            },
            "avg_loss_per_year": {
              "value": "$836,748.50",
              "color": "green"
            },
            "total_loss": "$1,673,497",
            "total_claims": 7,
            "avg_claims_per_year": 3.5,
            "num_cat_claims": 1,
            "num_attr_claims": 3,
            "num_unknown_claims": 3
          },
          "analysis_sections": [
            {
              "section_title": "📈 Loss Frequency & Severity Analysis",
              "narrative": "The book shows low overall claim count (7 across 2 provided years), but the severity distribution is highly skewed by a single catastrophic wind loss in 2018–2019 accounting for ~99% of total incurred. Excluding CAT, the remaining incurred is modest (~$19.5K) across six non-CAT/unknown claims, implying low average severity but meaningful frequency in 2020–2021 (five claims in that one period). All listed claims are closed with no outstanding reserves on the valuation date, but the valuation is stale (2/11/2022), and there is no visibility into the most recent four policy periods—limiting trend credibility and loss development analysis.",
              "bullets": [
                "Non-CAT average severity ≈ $3.3K (low-severity profile).",
                "Concentration of frequency in 2020–2021 suggests a potentially operational/maintenance-driven year.",
                "Stale valuation date; need currently valued 5–7 year loss runs to confirm no late development."
              ]
            },
            {
              "section_title": "🌪️ Catastrophic vs Attritional Loss Profile",
              "narrative": "CAT exposure is the dominant driver of loss potential: one wind event incurred $1.65M, signaling material susceptibility to severe weather (likely windstorm/hurricane). Given this outsized loss, pricing and structure should be driven by peril-specific CAT considerations (location, construction, roof age, secondary modifiers, and wind/hail or named storm deductibles). Attritional losses are otherwise manageable from a severity standpoint, suggesting that with appropriate CAT retentions and mitigation, the risk could be viable.",
              "bullets": [
                "One CAT claim; 98.8%+ of total incurred tied to wind.",
                "Consider higher Named Storm/Wind/Hail deductibles or sublimits to control severity.",
                "Request CAT modeling or ZIP/ISO territory details; confirm roof specs and wind mitigation features."
              ]
            },
            {
              "section_title": "🚰 Claims Cause & Trend Evaluation",
              "narrative": "Water-related events (three pipe/appliance claims) and a mold claim cluster in 2020 indicate potential plumbing/maintenance vulnerabilities and moisture control issues. A separate collision claim and an “other physical damage” claim point to mixed line exposure or unclear coding; coverage line clarity is required. Seasonal signal appears in summer water losses and an autumn wind CAT, aligning with weather-driven risk in the operating geography.",
              "bullets": [
                "Verify line(s) of business: property vs. auto exposure (presence of ‘Collision’).",
                "Obtain details on plumbing age/materials, leak detection, shutoff valves, and humidity controls.",
                "If property: consider water damage deductible/endorsements and require moisture intrusion controls."
              ]
            },
            {
              "section_title": "🎯 Underwriter's Assessment",
              "narrative": "Conditional Accept. The account demonstrates manageable attritional severity but pronounced CAT severity potential driven by wind. The absence of recent loss runs (2021–2025) and a stale valuation create material information risk, and causation/line ambiguity (collision, physical damage) needs resolution. Proceed with a CAT-forward structure and disciplined water-damage risk controls, contingent on receipt and satisfactory review of currently valued, complete loss runs and exposure details (location, construction, roof age, protections). Pricing should reflect a strong wind peril load, credible CAT modeling (if available), and a modest attritional load given the 2020 frequency. If recent losses or adverse development emerge, re-rate or reconsider.",
              "bullets": [
                "Bind subject to: 5–7 years currently valued loss runs through present and clarity on coverage lines/exposures.",
                "Indicative pricing: elevated CAT rate with Named Storm/Wind/Hail percentage deductible; modest attritional load; consider water deductible increase.",
                "Risk management: implement leak detection/automatic shutoffs, roof inspection/maintenance plan, moisture controls, and documented wind mitigation features."
              ]
            }
          ],
          "numerical_trends": [
            {
              "year": 2020,
              "loss_amount": 17817,
              "claims_count": 5
            },
            {
              "year": 2021,
              "loss_amount": 0,
              "claims_count": 0
            },
            {
              "year": 2022,
              "loss_amount": 0,
              "claims_count": 0
            },
            {
              "year": 2023,
              "loss_amount": 0,
              "claims_count": 0
            },
            {
              "year": 2024,
              "loss_amount": 0,
              "claims_count": 0
            }
          ],
          "pie_charts": {
            "cat_vs_attritional": [
              {
                "category": "Attr",
                "total_loss": 2418,
                "percentage": 0.1
              },
              {
                "category": "Cat",
                "total_loss": 1653980,
                "percentage": 98.8
              },
              {
                "category": "Unknown",
                "total_loss": 17099,
                "percentage": 1
              }
            ],
            "loss_cause_distribution": [
              {
                "loss_cause": "Collision",
                "total_loss": 9400,
                "percentage": 0.6
              },
              {
                "loss_cause": "Mold",
                "total_loss": 5999,
                "percentage": 0.4
              },
              {
                "loss_cause": "Physical Damage",
                "total_loss": 1700,
                "percentage": 0.1
              },
              {
                "loss_cause": "Water Damage",
                "total_loss": 2418,
                "percentage": 0.1
              },
              {
                "loss_cause": "Wind",
                "total_loss": 1653980,
                "percentage": 98.8
              }
            ]
          }
        }
      ],
    }
    if (!this.lossRunChartRef || !lr?.loss_run[0]?.numerical_trends) {
      console.error('iiiii')
      return;
    }
    const ctx = this.lossRunChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const trends = lr.loss_run[0].numerical_trends;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trends.map((trend: any) => trend.year.toString()),
        datasets: [
          {
            label: 'Loss Amount',
            data: trends.map((trend: any) => trend.loss_amount),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Claims Count',
            data: trends.map((trend: any) => trend.claims_count * 100000), // Scale for visibility
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) {
                  return `Loss Amount: $${context.parsed.y.toLocaleString()}`;
                } else {
                  const actualCount = Math.round(context.parsed.y / 100000);
                  return `Claims Count: ${actualCount}`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: '#e2e8f0'
            },
            ticks: {
              font: {
                size: 12,
                weight: 500
              },
              color: '#64748b'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
              color: '#e2e8f0'
            },
            ticks: {
              callback: (value) => '$' + (value as number).toLocaleString(),
              font: {
                size: 12
              },
              color: '#64748b'
            },
            title: {
              display: true,
              text: 'Loss Amount ($)',
              color: '#64748b',
              font: {
                size: 12,
                weight: 600
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: (value) => Math.round((value as number) / 100000),
              font: {
                size: 12
              },
              color: '#64748b'
            },
            title: {
              display: true,
              text: 'Claims Count',
              color: '#64748b',
              font: {
                size: 12,
                weight: 600
              }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private catVsAttritionalChart: Chart | null = null;
  private lossCauseChart: Chart | null = null;
  private createLossRunPieCharts(): void {
    console.log('Creating loss run pie charts...');

    if (this.activeTab !== 'loss-run' || this.lossRunActiveSubTab !== 'lrvisuals') {
      console.log('Not on loss run visuals tab, skipping chart creation');
      return;
    }

    const lr = {
      "loss_run": [
        {
          "loss_profile": {
            "avg_claims_per_year": "3.5",
            "avg_loss_per_year": {
              "color": "green",
              "value": "$836,748.50"
            },
            "num_attr_claims": "3",
            "num_cat_claims": "1",
            "num_unknown_claims": "3",
            "total_claims": "7",
            "total_loss": "$1,673,497",
            "years_loss_run_provided": {
              "color": "red",
              "value": "2"
            }
          },
          "numerical_trends": [
            {
              "claims_count": 5,
              "loss_amount": 17817,
              "year": 2020
            },
            {
              "claims_count": 0,
              "loss_amount": 0,
              "year": 2021
            },
            {
              "claims_count": 0,
              "loss_amount": 0,
              "year": 2022
            },
            {
              "claims_count": 0,
              "loss_amount": 0,
              "year": 2023
            },
            {
              "claims_count": 0,
              "loss_amount": 0,
              "year": 2024
            }
          ],
          "pie_charts": {
            "cat_vs_attritional": [
              {
                "category": "Attr",
                "percentage": 0.1,
                "total_loss": 2418
              },
              {
                "category": "Cat",
                "percentage": 98.8,
                "total_loss": 1653980
              },
              {
                "category": "Unknown",
                "percentage": 1,
                "total_loss": 17099
              }
            ],
            "loss_cause_distribution": [
              {
                "loss_cause": "Collision",
                "percentage": 0.6,
                "total_loss": 9400
              },
              {
                "loss_cause": "Mold",
                "percentage": 0.4,
                "total_loss": 5999
              },
              {
                "loss_cause": "Other Physical Damage",
                "percentage": 0.1,
                "total_loss": 1700
              },
              {
                "loss_cause": "Water Dishwasher",
                "percentage": 0,
                "total_loss": 325
              },
              {
                "loss_cause": "Water Pipes",
                "percentage": 0.1,
                "total_loss": 2093
              },
              {
                "loss_cause": "Wind",
                "percentage": 98.8,
                "total_loss": 1653980
              }
            ]
          }
        }
      ]
    };

    const lossRunData = lr?.loss_run[0];

    if (!lossRunData) {
      console.error('No loss run data found');
      return;
    }

    // Destroy existing charts first
    if (this.catVsAttritionalChart) {
      this.catVsAttritionalChart.destroy();
      this.catVsAttritionalChart = null;
    }

    if (this.lossCauseChart) {
      this.lossCauseChart.destroy();
      this.lossCauseChart = null;
    }

    // Check if ViewChild elements exist
    console.log('catVsAttritionalChartRef:', this.catVsAttritionalChartRef);
    console.log('lossCauseChartRef:', this.lossCauseChartRef);

    if (!this.catVsAttritionalChartRef?.nativeElement) {
      console.warn('CAT vs Attritional chart element not found, retrying...');
      setTimeout(() => this.createLossRunPieCharts(), 100);
      return;
    }

    if (!this.lossCauseChartRef?.nativeElement) {
      console.warn('Loss Cause chart element not found, retrying...');
      setTimeout(() => this.createLossRunPieCharts(), 100);
      return;
    }

    try {
      // Cat vs Attritional Chart
      if (lossRunData.pie_charts?.cat_vs_attritional?.length) {
        console.log('Creating CAT vs Attritional chart');
        const catData = lossRunData.pie_charts.cat_vs_attritional;
        const catCtx = this.catVsAttritionalChartRef.nativeElement.getContext('2d');

        if (catCtx) {
          this.catVsAttritionalChart = new Chart(catCtx, {
            type: 'pie',
            data: {
              labels: catData.map((item: any) => item.category),
              datasets: [{
                data: catData.map((item: any) => item.total_loss),
                backgroundColor: this.chartColors.slice(0, catData.length),
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false // Using custom legend
                },
                tooltip: {
                  callbacks: {
                    label: function (context: any) {
                      const item = catData[context.dataIndex];
                      return `${item.category}: $${item.total_loss.toLocaleString()} (${item.percentage}%)`;
                    }
                  }
                }
              }
            }
          });
          console.log('CAT vs Attritional chart created successfully');
        }
      }

      // Loss Cause Distribution Chart
      if (lossRunData.pie_charts?.loss_cause_distribution?.length) {
        console.log('Creating Loss Cause chart');
        const causeData = lossRunData.pie_charts.loss_cause_distribution;
        const causeCtx = this.lossCauseChartRef.nativeElement.getContext('2d');

        if (causeCtx) {
          this.lossCauseChart = new Chart(causeCtx, {
            type: 'pie',
            data: {
              labels: causeData.map((item: any) => item.loss_cause),
              datasets: [{
                data: causeData.map((item: any) => item.total_loss),
                backgroundColor: this.chartColors.slice(0, causeData.length),
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false // Using custom legend
                },
                tooltip: {
                  callbacks: {
                    label: function (context: any) {
                      const item = causeData[context.dataIndex];
                      return `${item.loss_cause}: $${item.total_loss.toLocaleString()} (${item.percentage}%)`;
                    }
                  }
                }
              }
            }
          });
          console.log('Loss Cause chart created successfully');
        }
      }
    } catch (error) {
      console.error('Error creating loss run pie charts:', error);
    }
  }

  private createPieCharts(): void {


    const sovData = this.submissionDetail?.sov?.[0]; // Add [0]
    const chartData = sovData?.sov_charts; if (!chartData) return;

    // Coverage Chart
    if (this.coverageChartRef && chartData.coverageData?.length) {
      this.createPieChart(
        this.coverageChartRef.nativeElement,
        chartData.coverageData,
        'Coverage'
      );
    }

    // Occupancy Chart
    if (this.occupancyChartRef && chartData.occupancyData?.length) {
      this.createPieChart(
        this.occupancyChartRef.nativeElement,
        chartData.occupancyData,
        'Occupancy'
      );
    }

    // Construction Chart
    if (this.constructionChartRef && chartData.constructionData?.length) {
      this.createPieChart(
        this.constructionChartRef.nativeElement,
        chartData.constructionData,
        'Construction'
      );
    }

    // Year Built Chart
    if (this.yearBuiltChartRef && chartData.yearBuiltData?.length) {
      this.createPieChart(
        this.yearBuiltChartRef.nativeElement,
        chartData.yearBuiltData,
        'Year'
      );
    }
  }

  private createPieChart(canvas: HTMLCanvasElement, data: any[], labelKey: string): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const filteredData = data.filter(item => item.Percent > 0);

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: filteredData.map(item => item[labelKey]),
        datasets: [{
          data: filteredData.map(item => item.Percent),
          backgroundColor: this.chartColors.slice(0, filteredData.length),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const item = filteredData[context.dataIndex];
                return `${context.label}: $${item.TIV.toLocaleString()} (${item.Percent}%)`;
              }
            }
          }
        },
        animation: {
          duration: 1000
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }



  getVisibleBullets(bullets: string[]): string[] {
    const section = this.submissionDetail?.email?.analysis_sections?.find(
      (s: any) => s.bullets === bullets
    ) || this.submissionDetail?.loss_run?.analysis_sections?.find(
      (s: any) => s.bullets === bullets
    ) || this.submissionDetail?.sov?.analysis_sections?.find(
      (s: any) => s.bullets === bullets
    );

    if (!section || section.expanded) {
      return bullets;
    }
    return bullets.slice(0, this.maxBullets);
  }

  toggleBulletsExpanded(section: any): void {
    section.expanded = !section.expanded;
  }

  toggleAnalysisSummaryExpanded(): void {
    this.isAnalysisSummaryExpanded = !this.isAnalysisSummaryExpanded;
  }

  toggleAccordion(accordionKey: string): void {
    this.expandedAccordions[accordionKey] = !this.expandedAccordions[accordionKey];
  }

  getRiskSignalKeys(): string[] {
    const riskSignals = this.submissionDetail?.risk_signals;
    return riskSignals ? Object.keys(riskSignals) : [];
  }

  getMarketIntelligenceKeys(): string[] {
    const marketIntelligence = this.submissionDetail?.market_intelligence;
    return marketIntelligence ? Object.keys(marketIntelligence) : [];
  }

  formatSignalTitle(key: any): any {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase());
  }

  getRiskValue(item: any) {
    if (item?.value?.value) return item.value.value;
    return item.value;
  }

  getRiskColor(item: any): string {
    const color = item?.value?.color?.toLowerCase();
    switch (color) {
      case 'green': return 'rgba(0, 128, 0, 0.2)';
      case 'red': return 'rgba(255, 0, 0, 0.2)';
      case 'yellow': return 'rgba(255, 255, 0, 0.2)';
      default: return 'transparent';
    }
  }


  getTotalClaims(): number {
    if (!this.submissionDetail?.loss_run?.numerical_trends) return 0;

    return this.submissionDetail.loss_run.numerical_trends.reduce(
      (sum: any, trend: any) => sum + trend.claims_count, 0
    );
  }

  getTotalIncurred(): number {
    if (!this.submissionDetail?.loss_run?.numerical_trends) return 0;

    return this.submissionDetail.loss_run.numerical_trends.reduce(
      (sum: any, trend: any) => sum + trend.loss_amount, 0
    );
  }

  getAveragePerClaim(): number {
    const totalClaims = this.getTotalClaims();
    const totalIncurred = this.getTotalIncurred();

    return totalClaims > 0 ? totalIncurred / totalClaims : 0;
  }

  onFollowUpSelected(question: FollowUpQuestion): void {
    // Add the follow-up question as a chat message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question.text,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: `I'll help you with: ${question.text}. Based on the submission analysis, I can provide detailed insights and next steps for this request.`,
        timestamp: new Date()
      };
      this.chatMessages.push(botMessage);
    }, 1000);
  }

  onSendEmailToBroker(): void {
    this.openEmailPanel();
  }

  onEmailModalClose(): void {
    this.showEmailModal = false;
  }

  onEmailSent(): void {
    this.showEmailModal = false;
    this.notificationService.showSuccess('Information request sent successfully to broker');
  }

  emailDraft: { to?: string; subject?: string; body?: string } | null = null;
  isBotLoading: boolean = false;

  onSendMessage(content: string): void {
    if (!this.chatId || !content.trim()) return;

    // 1. Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);
    this.triggerAutoScroll();
    // ---------- Case 1: CAT Modeling ----------
    if (content === "The submission looks complete with the required data. Would you like me to proceed with CAT modeling now?") {
      const steps = [
        "🔄 Standardizing submission data…",
        "📊 Preparing catastrophe model input dataset…",
        "🚀 Catastrophe model execution initiated…"
      ];

      let stepIndex = 0;

      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          const botMsg: any = {
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: `${stepIndex + 1}. ${steps[stepIndex]}`, // ✅ show as 1., 2., 3.
            timestamp: new Date(),
            subtype: 'cat-modeling',
            isCatStep: true,
          };
          this.chatMessages.push(botMsg);
          this.triggerAutoScroll();
          stepIndex++;
        } else {
          clearInterval(interval);

          const finalMsg: any = {
            id: `bot-${Date.now()}`,
            type: 'bot',
            content:
              "✅ Catastrophe modeling has been initiated. The full analysis will take approximately 12 hours. You’ll be notified once the results are ready.",
            timestamp: new Date(),
            subtype: 'cat-modeling',
            isFinal: true, // optional flag for UI
          };

          this.chatMessages.push(finalMsg);
          this.triggerAutoScroll();
        }
      }, 5000);

      return; // skip API
    }

    // ---------- Case 2: Target Premium ----------
    if (content === "I noticed the broker hasn’t shared a target premium. Do you want me to reach out to them for this information?") {
      this.showBotLoading();

      this.submissionService
        .sendMessage(this.chatId, "Do you want to send an email to Broker asking for target premium?")
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.hideBotLoading();

            const newMessage = {
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: response?.content || '⚠️ No response received.',
              timestamp: new Date(),
              actions: [] as any[]
            };

            this.chatMessages.push(newMessage);

            if (response?.content?.includes("Would you like to preview it?")) {
              this.emailDraft = {
                to: response?.metadata?.to,
                subject: response?.metadata?.subject,
                body: response?.metadata?.body
              };

              newMessage.actions = [
                { label: "✅ Yes, preview it", action: "previewMail" }
              ];
            }

            this.triggerAutoScroll();
          },
          error: (error) => {
            this.hideBotLoading();

            this.chatMessages.push({
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: error.message || '⚠️ Failed to send message.',
              timestamp: new Date()
            });
            this.triggerAutoScroll();
          },
          complete: () => this.hideBotLoading()
        });
      return;
    }

    // ---------- Case 3: Roof Score ----------
    if (content === "Should I fetch the roof score from CAPE for the top TIV locations?") {
      this.chatMessages.push({
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: "🏠 Retrieving roof scores from CAPE for the top TIV locations. I’ll confirm once the data is available.",
        timestamp: new Date()
      });
      this.triggerAutoScroll();
      return;
    }

    // ---------- Fallback: Normal API ----------
    this.showBotLoading();

    this.submissionService.sendMessage(this.chatId, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.hideBotLoading();

          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: response?.content || '⚠️ No response received.',
            timestamp: new Date()
          });

          this.triggerAutoScroll();
        },
        error: (error) => {
          this.hideBotLoading();

          this.chatMessages.push({
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: error.message || '⚠️ Failed to send message.',
            timestamp: new Date()
          });
          this.triggerAutoScroll();
        },
        complete: () => this.hideBotLoading()
      });
  }

  /* --- Helper functions for loading bubble --- */
  private showBotLoading() {
    this.isBotLoading = true;
  }

  private hideBotLoading() {
    this.isBotLoading = false;
  }

  goBack(): void {
    this.router.navigate(['/home/underwriting/dashboard']);
  }

  isEmailPanelOpen = false;
  isNotesPanelOpen = false;
  selectedSubmissionId = 'SUB-69069';
  selectedNoteId = '';
  previewResponse: string | null = null;

  openEmailPanel(): void {
    // if (!this.chatId) return;

    // const query = "Do you want to send an email to Broker asking for BOR and additional loss runs?";

    // // show loader (optional)
    // this.isLoading = true;

    // this.submissionService.sendMessage(this.chatId, query)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       // store in variable
    //       this.previewResponse = response?.content || null;

    //       // also push into chat if you want (optional)
    //       // this.chatMessages.push({
    //       //   id: `bot-${Date.now()}`,
    //       //   type: 'bot',
    //       //   content: this.previewResponse || '⚠️ No response received.',
    //       //   timestamp: new Date()
    //       // });
    //     },
    //     error: (error) => {
    //       this.previewResponse = error.message || '⚠️ Failed to send message.';
    //     },
    //     complete: () => {
    //       this.isLoading = false;
    //     }
    //   });


    this.isEmailPanelOpen = true;
  }


  closeEmailPanel(): void {
    this.isEmailPanelOpen = false;
  }

  openNotesPanel(): void {
    this.selectedNoteId = 'demo-note-' + Date.now();
    this.isNotesPanelOpen = true;
  }

  closeNotesPanel(): void {
    this.isNotesPanelOpen = false;
  }

  formatArrayValue(value: any): string {
    if (!value) return 'Not Provided';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.map(item => this.toTitleCase(item)).join(', ');
    }

    return this.toTitleCase(value.toString());
  }

  formatValue(value: any): string {
    if (!value || value === null || value === undefined) return 'Not Provided';
    return this.toTitleCase(value.toString());
  }

  formatRequestedDeductibles(): string {
    const deductibles = this.submissionDetail?.submission_profile?.requested_deductibles;
    if (!deductibles || !Array.isArray(deductibles)) return 'Not Provided';

    return deductibles.map(ded => `${ded.coverage}: ${ded.amount || 'Not Provided'}`).join(', ');
  }


  private toTitleCase(str: string): string {
    if (!str) return '';

    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getRequestedLimitsArray(): any[] {
    const limits = this.submissionDetail?.submission_profile?.requested_limits;
    if (!limits) return [];

    return Object.entries(limits).map(([key, value]) => ({
      key,
      value: value || 'Not Provided'
    }));
  }

  getRecommendationClass(): string {
    const recommendation = this.submissionDetail?.submission_overview?.risk_analysis?.overall_recommendation?.status;

    switch (recommendation?.toLowerCase()) {
      case 'good to proceed':
        return 'rec-approve';
      case 'decline':
        return 'rec-decline';
      case 'conditional':
        return 'rec-conditional';
      default:
        return 'rec-unknown';
    }
  }

  get recommendedActions(): string[] {
    return this.submissionDetail?.submission_overview?.actions || [];
  }


  getConfidenceLevelClass(): string {
    const confidence = this.submissionDetail?.risk_analysis?.overall_recommendation?.confidence_level;

    switch (confidence) {
      case 'high':
        return 'conf-high';
      case 'medium':
        return 'conf-medium';
      case 'low':
        return 'conf-low';
      default:
        return 'conf-unknown';
    }
  }


  formatLinksInText(text: string): string {
    return text.replace(/\[([^\]]+)\]/g, '<a href="$1" target="_blank" class="inline-link">$1</a>');
  }

  chatId = '68c05bd77d59c0e91d6816c4';

  private loadChatHistory(): void {
    console.log('invokedd')
    this.isLoading = true;

    this.submissionService.getChatById(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.messages) {
            this.chatMessages = response.messages.map((msg: any, index: number) => ({
              id: `${msg.role}-${index}`,   // generate id since backend doesn’t send one
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: new Date() // no timestamp in payload, so fallback to "now"
            }));
          } else {
            this.chatMessages = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching chat:', error);
          this.chatMessages = [];
          this.isLoading = false;
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.scrollToBottom());
        }
      });
  }


  onActionClick(actionType: string): void {
    if (actionType === 'open-submission') {
      this.router.navigate(['/home/underwriting/submission', 'SUB-001']);
    }
  }


  chatMessages: any[] = [];
  onMessageSubmit(content: string): void {
    if (!this.chatId || !content.trim()) return;

    // 1. Immediately show user’s message
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    this.chatMessages.push(userMsg);

    // 2. Create empty bot bubble
    const botMsg = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: '',
      timestamp: new Date()
    };
    this.chatMessages.push(botMsg);

    // 3. Kick off streaming call
    this.streamBotReply(this.chatId, content, botMsg);
  }

  /**
   * Stream bot reply token by token
   */
  private streamBotReply(chatId: string, userContent: string, botMsg: any): void {
    const url = `https://sense-dev-backend-service-as.azurewebsites.net/api/v1/conversations/${chatId}/messages`;

    const token = localStorage.getItem('token');

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: { content: userContent } })
    })
      .then(response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const pump = (): any =>
          reader!.read().then(({ done, value }) => {
            if (done) return;

            const chunk = decoder.decode(value, { stream: true });

            // Split by new lines (SSE events are line-delimited)
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

            for (const line of lines) {
              const data = line.replace(/^data:\s*/, '');

              if (data === '[DONE]') {
                console.log('Stream complete');
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed?.content) {
                  botMsg.content += parsed.content;
                  this.ngZone.run(() => { }); // update Angular UI
                }
              } catch (err) {
                console.warn('Non-JSON SSE data:', data);
              }
            }

            return pump();
          });

        return pump();
      })
      .catch(err => {
        console.error('Streaming error:', err);
        botMsg.content += '\n[Error receiving response]';
      });
  }

  onCopy(message: any): void {
    navigator.clipboard.writeText(message.content).then(() => {
      console.log('Copied:', message.content);
    });
  }

  onShare(message: any): void {
    if (navigator.share) {
      navigator.share({
        title: 'Chat Message',
        text: message.content
      }).catch(err => console.warn('Share failed', err));
    } else {
      console.log('Share not supported in this browser');
    }
  }

  onRetry(message: any): void {
    // retry bot response logic
    console.log('Retry clicked for message:', message);
    // You could re-trigger streamBotReply here if needed
  }

  onEdit(message: any): void {
    console.log('Edit clicked for message:', message);
    // you can populate the input box with old message for editing
  }
  copiedMessageId: string | null = null;

  onCopyClick(message: any): void {
    navigator.clipboard.writeText(message.content).then(() => {
      this.copiedMessageId = message.id;

      // hide after 2s
      setTimeout(() => {
        this.copiedMessageId = null;
      }, 2000);
    });
  }




  @ViewChild('selectableArea') selectableArea!: ElementRef;

  selectionText: string = '';
  menuPosition = { x: 0, y: 0 };


  onDeepDive(selectedText: string) {
    console.log('Deep Dive on:', selectedText);
    this.commonService.setSelectedText(selectedText);
  }

  onShowSource() {
    console.log('Show Source for:', this.selectionText);
  }

  currentSlide = 0;
  cardsPerView = 3; // Define how many cards to show at once

  getMarketIntelligenceEntries(): any[] {
    const marketIntelligence = this.submissionDetail?.submission_overview?.market_intelligence;
    if (!marketIntelligence) return [];

    return Object.entries(marketIntelligence).map(([key, value], index) => ({
      key,
      title: this.formatIntelligenceTitle(key),
      content: value,
      id: index // Add a unique ID for tracking
    }));
  }

  // Get the total number of full "pages" or groups of cards
  get totalSlides(): number {
    const entries = this.getMarketIntelligenceEntries();
    if (entries.length === 0) return 0;
    return Math.ceil(entries.length / this.cardsPerView);
  }

  // Navigate to the next slide
  nextSlide(): void {
    if (!this.isLastSlide()) {
      this.currentSlide++;
    }
  }

  // Navigate to the previous slide
  prevSlide(): void {
    if (!this.isFirstSlide()) {
      this.currentSlide--;
    }
  }

  // Check if it's the first slide to disable the previous button
  isFirstSlide(): boolean {
    return this.currentSlide === 0;
  }

  // Check if it's the last slide to disable the next button
  isLastSlide(): boolean {
    return this.currentSlide === this.totalSlides - 1;
  }

  formatIntelligenceTitle(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // view loss run

  isRightPanelOpen = false;
  panelTitle = '';
  pdfUrl = '';

  openPdfPreview(submissionId: string, mailId: string, url: string) {
    this.panelTitle = 'PDF Preview';
    this.isRightPanelOpen = true;
    this.pdfUrl = url;

    this.submissionService.getPdfUrl(submissionId, mailId).subscribe({
      next: (res) => {
        // this.pdfUrl = 'https://sensedevdocs.blob.core.windows.net/emails-data/3b11a836-c336-4fd7-a4df-d4dfc9459723/lr_model.pdf?se=2026-05-16T13%3A30%3A47Z&sp=r&sv=2025-07-05&sr=b&sig=J8pHMMvocdLvHU7c/2ZV8Gv8ldyO/zVbEU3SRbZJwro%3D'; // ✅ only the PDF URL
      },
      error: () => this.pdfUrl = ''
    });

  }

  @ViewChild('chatMessage') private chatMessagesContainer!: ElementRef<HTMLDivElement>;


  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop =
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  private autoScrollPending = false;

  ngAfterViewChecked(): void {
    if (this.autoScrollPending) {
      this.scrollToBottom();
      this.autoScrollPending = false;
    }
  }

  private triggerAutoScroll(): void {
    this.autoScrollPending = true;
  }

  getLossValue(item: any) {
    return item?.value?.value ?? item.value;
  }

  getColor(item: any) {
    const color = item?.value?.color?.toLowerCase();
    switch (color) {
      case 'green': return 'rgba(4, 204, 87, 1)';
      case 'red': return 'rgba(255, 0, 0, 1)';
      default: return '#1F2937'
    }

  }


}






