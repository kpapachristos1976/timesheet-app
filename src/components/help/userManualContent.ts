export interface ManualSection {
  title: string;
  content: string[];
  subsections?: { title: string; content: string[] }[];
}

export const USER_MANUAL: ManualSection[] = [
  {
    title: '1. Overview',
    content: [
      'CapacityView is a resource planning and timesheet analysis application. It allows you to import timesheet data, manage resource allocations, and visualize workload through interactive dashboards.',
      'The application runs entirely in your browser. All data is stored locally in your browser\'s storage -- no server or database is required.',
    ],
  },
  {
    title: '2. Import Data',
    content: [
      'The Import Data section allows you to load data from CSV or Excel files into four tables: Timesheet Data, Projects Reference, Roles Reference, and Resource Allocations.',
    ],
    subsections: [
      {
        title: '2.1 How to Import',
        content: [
          '1. Navigate to "Import Data" from the sidebar.',
          '2. Click "Choose File" on the relevant importer section.',
          '3. Select a CSV or Excel (.xlsx) file from your computer.',
          '4. If importing CSV, select the correct delimiter (comma, semicolon, tab, or pipe).',
          '5. Map your file columns to the required fields using the dropdown menus.',
          '6. Preview the data in the table below the field mappings.',
          '7. Click "Import" to load the data.',
          'Note: Importing replaces all existing records in that table.',
        ],
      },
      {
        title: '2.2 Timesheet Data Fields',
        content: [
          'Resource Name -- The name of the person who logged the time.',
          'Stream -- The work stream (e.g., Data Analysis, Data Management).',
          'PID -- Project identifier.',
          'Project -- Project name.',
          'Description -- Combined project description.',
          'Week Ending -- The week ending date for the timesheet entry.',
          'Role -- The role of the resource.',
          'Total Hours -- The number of hours logged.',
          'Agreed Rates, Revenues, BC -- Financial fields.',
        ],
      },
      {
        title: '2.3 Projects Reference Fields',
        content: [
          'Project ID -- Unique project identifier.',
          'Project Title -- Name of the project.',
          'Description -- Project description.',
          'Status -- Project status (e.g., Active, Completed).',
          'Phase -- Current project phase.',
          'Start Date / End Date -- Project date range.',
          'Allocated Hours EY -- Total allocated hours for the project.',
          'RAGBY -- Project status indicator: On Track, At Risk, Delayed, Completed, or blank. Used for color coding in the Projects Dashboard Gantt chart.',
        ],
      },
      {
        title: '2.4 Roles Reference Fields',
        content: [
          'Role -- Role name (e.g., Senior Consultant).',
          'Rate Card -- The billing rate for the role.',
          'Onshore/Offshore -- Location classification.',
        ],
      },
      {
        title: '2.5 Resource Allocations Fields',
        content: [
          'Resource Name -- The name of the allocated resource.',
          'Stream -- The work stream.',
          'Project Description -- Description of the project.',
          'Project ID -- Unique project identifier.',
          'Start Date -- Allocation start date (YYYY-MM-DD format recommended).',
          'End Date -- Allocation end date (YYYY-MM-DD format recommended).',
          'Allocation Percentage -- The percentage of time allocated (e.g., 50 for 50%).',
        ],
      },
    ],
  },
  {
    title: '3. Resource Allocation',
    content: [
      'The Resource Allocation section allows you to manually create, edit, and delete resource allocations.',
    ],
    subsections: [
      {
        title: '3.1 Adding an Allocation',
        content: [
          '1. Click the "Add Allocation" button.',
          '2. Fill in the form fields:',
          '   - Resource Name: Type to search from existing timesheet resources.',
          '   - Stream: Select the work stream from the dropdown.',
          '   - Project: Type to search from imported projects (excludes Completed projects).',
          '   - Start Date / End Date: Select the allocation period.',
          '   - Allocation Percentage: Enter the percentage (1-100).',
          '3. Click "Create" to save.',
        ],
      },
      {
        title: '3.2 Editing and Deleting',
        content: [
          'Use the pencil icon to edit an existing allocation.',
          'Use the trash icon to delete an allocation (confirmation required).',
          'Use the search bar and stream filter to find specific allocations.',
        ],
      },
    ],
  },
  {
    title: '4. Resources Dashboard',
    content: [
      'The Resources Dashboard shows actual hours (from timesheets) vs planned hours (from allocations) for each resource.',
    ],
    subsections: [
      {
        title: '4.1 Filters',
        content: [
          'Stream -- Filter by work stream.',
          'Resource -- Filter by resource name.',
          'From / To -- Filter the chart and table to a specific date range. Actual hours are filtered by Week Ending date; planned hours are clipped to the selected range.',
        ],
      },
      {
        title: '4.2 Resource Detail View',
        content: [
          'Click on any resource row in the table to open the detail view.',
          'The detail view shows two timelines:',
          '1. Actual Hours timeline -- Total actual hours per week or month. Expand a project row to see per-project breakdown.',
          '2. Planned Hours timeline -- Total planned hours per week or month. Expand a project row to see per-project breakdown.',
          'Use the View dropdown to switch between weekly and monthly granularity.',
          'Click the back arrow to return to the main dashboard.',
        ],
      },
    ],
  },
  {
    title: '5. Projects Dashboard',
    content: [
      'The Projects Dashboard compares actual effort, allocated hours (EY), and planned hours per project.',
    ],
    subsections: [
      {
        title: '5.1 Project Timeline (Gantt)',
        content: [
          'A Gantt chart at the top shows projects with status "In Progress" on a monthly timeline.',
          'Each project bar is color-coded by its RAGBY status (from Projects Reference):',
          '  Green = On Track, Yellow = At Risk, Red = Delayed, Blue = Completed, Gray = Other/N/A.',
          'Use the "Start from" date picker to adjust the beginning of the timeline.',
          'The chart respects the project filter below.',
        ],
      },
      {
        title: '5.2 Projects Overview',
        content: [
          'Multi-select type-ahead project filter -- type to search and select multiple projects.',
          'Projects with status "Completed" are automatically excluded from the filter.',
          'Bar chart showing actual hours, allocated hours (EY), and planned hours per project.',
          'Second chart showing resource breakdown for selected projects.',
          'Resource breakdown table with detailed hours per resource per project.',
        ],
      },
    ],
  },
  {
    title: '6. Gantt Chart',
    content: [
      'The Gantt Chart section provides two timeline views for resource allocations.',
    ],
    subsections: [
      {
        title: '6.1 Resource Allocation Timeline',
        content: [
          'Shows resources on the Y-axis and time periods on the X-axis.',
          'Each cell displays the aggregated allocation percentage across all projects.',
          'Blue bars with opacity reflecting the allocation level.',
          'Hover over a bar to see the project-by-project breakdown.',
        ],
      },
      {
        title: '6.2 Project Allocation Timeline',
        content: [
          'Shows projects on the Y-axis and time periods on the X-axis.',
          'Each cell displays the aggregated allocation percentage across all resources.',
          'Click the expand arrow on a project to see individual resource allocations.',
          'Click again to collapse and hide the resource details.',
        ],
      },
      {
        title: '6.3 Filters',
        content: [
          'Stream -- Filter by work stream.',
          'Project -- Type-ahead search to filter by a specific project.',
          'Resource -- Filter by a specific resource.',
          'Timeline View -- Switch between weekly and monthly granularity.',
          'Start Date / End Date -- Customize the visible date range.',
          'All filters apply to both the resource and project Gantt charts.',
        ],
      },
    ],
  },
  {
    title: '7. Assistant',
    content: [
      'The Assistant allows you to ask questions about your data using natural language.',
    ],
    subsections: [
      {
        title: '7.1 How to Use',
        content: [
          '1. Navigate to "Assistant" from the sidebar.',
          '2. Type a question in the search box or click a suggested question.',
          '3. Press Enter or click the Send button.',
          '4. Results are displayed in tables below.',
        ],
      },
      {
        title: '7.2 Example Questions',
        content: [
          '"Which projects is John allocated to?" -- Shows all allocations for a resource.',
          '"Which resources are allocated to project ABC?" -- Shows resources on a project.',
          '"What is the actual effort for Jane?" -- Shows timesheet hours by project.',
          '"What are the total actual hours for project ABC?" -- Shows hours by resource.',
          '"What is the utilization of John?" -- Shows actual vs planned hours and utilization %.',
          '"Show all allocations for Data Management" -- Shows allocations for a stream.',
          '"Show details for project ABC" -- Shows project metadata.',
          '"What is the rate for Senior Consultant?" -- Shows role and rate information.',
          'You can also type any keyword (e.g., a name or project ID) for a free-text search across all tables.',
        ],
      },
      {
        title: '7.3 Query History',
        content: [
          'Recent queries are saved and displayed at the bottom of the page.',
          'Click a previous query to re-run it.',
        ],
      },
    ],
  },
  {
    title: '8. Data Storage',
    content: [
      'All data is stored in your browser\'s local storage. This means:',
      '- Data persists between browser sessions (as long as you don\'t clear browser data).',
      '- Data is private to your browser and device.',
      '- No internet connection is required after the initial page load.',
      '- Clearing your browser cache/storage will delete all imported data.',
      'To back up your data, export your resource allocations or keep your original CSV/Excel files.',
    ],
  },
  {
    title: '9. Tips and Troubleshooting',
    content: [
      'Date formats: Use YYYY-MM-DD format for best results. The app also supports DD/MM/YYYY and other common formats.',
      'CSV delimiters: If your data doesn\'t import correctly, try changing the delimiter setting.',
      'Blank Gantt chart: If the Gantt chart appears blank after import, verify that your date fields are mapped correctly and contain valid dates.',
      'Missing projects in dropdowns: Ensure projects are imported in the Projects Reference section first. Projects with status "Completed" are excluded from some filters.',
      'Browser compatibility: The app works best in modern browsers (Chrome, Edge, Firefox).',
    ],
  },
];
