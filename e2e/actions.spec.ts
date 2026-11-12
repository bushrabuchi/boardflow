import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({
    time: new Date('2030-06-10T09:00:00.000Z'),
  });

  await page.addInitScript(() => {
    if (localStorage.getItem('boardflow.meetings.v1') === null) {
      localStorage.setItem(
        'boardflow.meetings.v1',
        JSON.stringify([
          {
            id: 9001,
            title: 'Playwright test meeting',
            committee: 'Technology Committee',
            status: 'Scheduled',
            date: '2030-06-12',
            agendaItems: 1,
            completedActions: 0,
            totalActions: 0,
            members: ['NM'],
            accent: 'purple',
            agenda: ['Review delivery progress'],
            createdById: 'NM',
            assigneeId: 'NM',
            startTime: '10:00',
            endTime: '11:00',
            timeZone: 'Asia/Riyadh',
          },
        ]),
      );
    }

    if (localStorage.getItem('boardflow.actions.v1') === null) {
      localStorage.setItem('boardflow.actions.v1', '[]');
    }
  });
});

test('creates, edits and completes an action across refreshes', async ({ page }) => {
  await page.goto('/actions?meetingId=9001');

  await page
    .getByRole('button', {
      name: 'New action',
      exact: true,
    })
    .click();

  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('What needs to be done?').fill('Prepare delivery report');

  await dialog
    .getByLabel('Description', { exact: true })
    .fill('Include the remaining delivery milestones.');

  await dialog
    .getByRole('combobox', {
      name: 'Assigned to',
      exact: true,
    })
    .click();

  // The test meeting has exactly one participant.
  await page.getByRole('option').click();

  await dialog.getByLabel('Due date', { exact: true }).fill('2030-06-09');

  await dialog
    .getByRole('combobox', {
      name: 'Priority',
      exact: true,
    })
    .click();

  await page
    .getByRole('option', {
      name: 'High',
      exact: true,
    })
    .click();

  await dialog
    .getByRole('button', {
      name: 'Save action',
      exact: true,
    })
    .click();

  await expect(dialog).toHaveCount(0);

  let card = page.locator('.action-card').filter({
    has: page.getByRole('heading', {
      name: 'Prepare delivery report',
      exact: true,
    }),
  });

  await expect(card).toContainText('High priority');
  await expect(card).toContainText('Overdue');

  await page.reload();

  await expect(card).toBeVisible();

  await card
    .getByRole('button', {
      name: 'Edit action: Prepare delivery report',
      exact: true,
    })
    .click();

  await expect(dialog.getByLabel('What needs to be done?')).toHaveValue('Prepare delivery report');

  await dialog.getByLabel('What needs to be done?').fill('Prepare final delivery report');

  await dialog
    .getByRole('button', {
      name: 'Save changes',
      exact: true,
    })
    .click();

  await expect(dialog).toHaveCount(0);

  card = page.locator('.action-card').filter({
    has: page.getByRole('heading', {
      name: 'Prepare final delivery report',
      exact: true,
    }),
  });

  await card
    .getByRole('combobox', {
      name: 'Status for Prepare final delivery report',
      exact: true,
    })
    .click();

  await page
    .getByRole('option', {
      name: 'Completed',
      exact: true,
    })
    .click();

  await expect(card.getByRole('combobox')).toContainText('Completed');

  await page.reload();

  await expect(card.getByRole('combobox')).toContainText('Completed');

  await expect(card.locator('.overdue-badge')).toHaveCount(0);

  await page.goto('/dashboard');

  const openMetric = page.locator('.metric-card').filter({
    hasText: 'Open actions',
  });

  const overdueMetric = page.locator('.metric-card').filter({
    hasText: 'Overdue actions',
  });

  await expect(openMetric.locator('.metric-value')).toHaveText('0');
  await expect(overdueMetric.locator('.metric-value')).toHaveText('0');

  const meetingCard = page.locator('.meeting-card').filter({
    hasText: 'Playwright test meeting',
  });

  await expect(meetingCard).toContainText('1/1');
});

test('invalid meeting scope does not expose the global board', async ({ page }) => {
  await page.goto('/actions?meetingId=invalid');

  await expect(
    page.getByText('The requested meeting could not be found.', {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: 'New action',
      exact: true,
    }),
  ).toBeDisabled();

  await expect(page.locator('.action-card')).toHaveCount(0);
});

test('dashboard filters do not change workspace totals', async ({ page }) => {
  await page.goto('/dashboard');

  const totalMetric = page.locator('.metric-card').filter({
    hasText: 'Total meetings',
  });

  await expect(totalMetric.locator('.metric-value')).toHaveText('1');

  await page
    .getByLabel('Search meetings', {
      exact: true,
    })
    .fill('No matching meeting');

  await expect(page.getByRole('heading', { name: 'No matching meetings' })).toBeVisible();

  await expect(totalMetric.locator('.metric-value')).toHaveText('1');
});
