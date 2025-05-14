import { CommonModule } from '@angular/common';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { NgxAngularQueryBuilderModule } from 'ngx-angular-query-builder';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgxAngularQueryBuilderModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent {
  name: any = 'Angular';
  queryCtrl: any;
  query: any = {
    condition: 'and',
    rules: [
      { field: 'age', operator: '>=', entity: 'physical', value: 18 },
      {
        field: 'birthday',
        operator: '=',
        value: '2018-11-20',
        entity: 'nonphysical',
      },
      {
        condition: 'or',
        rules: [
          { field: 'gender', operator: '=', entity: 'physical', value: 'm' },
          { field: 'school', operator: 'is null', entity: 'nonphysical' },
          { field: 'notes', operator: '=', entity: 'nonphysical', value: 'Hi' },
        ],
      },
    ],
  };

  oDataFilter: any = 'hello';

  config: any = {
    fields: {
      age: { name: 'Age', type: 'number' },
      gender: {
        name: 'Gender',
        type: 'category',
        options: [
          { name: 'Male', value: 'm' },
          { name: 'Female', value: 'f' },
        ],
      },
      name: { name: 'Name', type: 'string' },
      notes: { name: 'Notes', type: 'string', operators: ['=', '!='] },
      educated: { name: 'College Degree?', type: 'boolean' },
      birthday: {
        name: 'Birthday',
        type: 'date',
        operators: ['=', '<=', '>'],
        defaultValue: () => new Date(),
      },
      school: { name: 'School', type: 'string', nullable: true },
      occupation: {
        name: 'Occupation',
        type: 'category',
        options: [
          { name: 'Student', value: 'student' },
          { name: 'Teacher', value: 'teacher' },
          { name: 'Unemployed', value: 'unemployed' },
          { name: 'Scientist', value: 'scientist' },
        ],
      },
    },
  };

  private BASE_URL: any =
    'https://odatasampleservices.azurewebsites.net/V4/Northwind/Northwind.svc/';

  constructor(private formBuilder: FormBuilder) {
    this.queryCtrl = this.formBuilder.control(this.query);

    this.queryCtrl.valueChanges.subscribe((ruleSet: any) => {
      this.oDataFilter = `${this.BASE_URL}?$filter=${this.toODataString(
        ruleSet
      )}`;
    });
  }

  private toODataString(ruleSet: any): string {
    return this.toOdataFilter(ruleSet, true);
  }

  toOdataFilter(filter: any, useOdataFour: boolean): any {
    if (filter == null) return 'null';

    var result: any[] = [],
      condition: any = filter.condition || 'and',
      idx: any,
      length: any,
      field: any,
      type: any,
      format: any,
      operator: any,
      value: any,
      ignoreCase: any,
      rules: any = filter.rules;

    for (idx = 0, length = rules.length; idx < length; idx++) {
      filter = rules[idx];
      field = filter.field;
      value = filter.value;
      operator = filter.operator;

      if (filter.rules) {
        filter = this.toOdataFilter(filter, useOdataFour);
      } else {
        ignoreCase = filter.ignoreCase;
        field = field.replace(/\./g, '/');
        filter = this.odataFilters[operator];
        if (useOdataFour) {
          filter = this.odataFiltersVersionFour[operator];
        }

        if (
          operator === 'isnull' ||
          operator === 'is null' ||
          operator === 'isnotnull'
        ) {
          filter = `${field} ${filter} null`;
        } else if (operator === 'isempty' || operator === 'isnotempty') {
          filter = `${field} ${filter} ''`;
        } else if (filter && value !== undefined) {
          type = typeof value;
          if (type === 'string') {
            format = "'{1}'";
            value = value.replace(/'/g, "''");
            if (ignoreCase === true) {
              field = 'tolower(' + field + ')';
            }
          } else if (type === 'date') {
            format = "datetime'{1:yyyy-MM-ddTHH:mm:ss}'";
          } else {
            format = '{1}';
          }

          if (filter.length > 3) {
            if (filter !== 'substringof') {
              format = '{0}({2},' + format + ')';
            } else {
              format = '{0}(' + format + ',{2})';
              if (operator === 'doesnotcontain') {
                if (useOdataFour) {
                  format = "{0}({2},'{1}') eq -1";
                  filter = 'indexof';
                } else {
                  format += ' eq false';
                }
              }
            }
          } else {
            format = '{2} {0} ' + format;
          }

          filter = this.formatString(format, filter, value, field);
        }
      }

      result.push(filter);
    }

    filter = result.join(' ' + condition + ' ');
    if (result.length > 1) {
      filter = '(' + filter + ')';
    }

    return filter;
  }

  private formatString(format: string, ...args: any[]): string {
    return format.replace(/{(\d+)}/g, (match, number) =>
      typeof args[number] !== 'undefined' ? args[number] : match
    );
  }

  private odataFilters: any = {
    eq: 'eq',
    neq: 'ne',
    gt: 'gt',
    gte: 'ge',
    lt: 'lt',
    lte: 'le',
    contains: 'substringof',
    doesnotcontain: 'substringof',
    endswith: 'endswith',
    startswith: 'startswith',
    isnull: 'eq',
    isnotnull: 'ne',
    isempty: 'eq',
    isnotempty: 'ne',
  };

  private odataFiltersVersionFour: any = {
    eq: 'eq',
    '=': 'eq',
    neq: 'ne',
    '!=': 'ne',
    gt: 'gt',
    '>': 'gt',
    gte: 'ge',
    '>=': 'ge',
    lt: 'lt',
    '<': 'lt',
    lte: 'le',
    '<=': 'le',
    like: 'contains',
    doesnotcontain: 'substringof',
    endswith: 'endswith',
    startswith: 'startswith',
    isnull: 'eq',
    'is null': 'eq',
    isnotnull: 'ne',
    isempty: 'eq',
    isnotempty: 'ne',
    contains: 'contains',
  };

  onSubmit() {
    this.query = this.queryCtrl.value;
    this.oDataFilter = this.generateODataFilter(this.query);

    console.log('query------', this.query);
    console.log('oDataFilter------', this.oDataFilter);
  }
  // Example function to generate OData filter from query object
  generateODataFilter(query: any): string {
    // Replace this logic with actual OData conversion based on your config
    return JSON.stringify(query); // Placeholder
  }
}
