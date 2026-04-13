/// <reference types="cypress" />

describe("Task Management", () => {
  beforeEach(() => {
    cy.fixture("user").then((user) => {
      cy.login(user.email, user.password);
    });
    cy.visit("/");
    cy.get(".dashboard", { timeout: 10000 }).should("exist");
  });


  it("shows the dashboard after login", () => {
    cy.get(".dashboard").should("exist");
    cy.get(".sidebar-logo").should("contain", "Taskr");
    cy.get(".main-header h1").should("exist");
  });

  it("shows the search bar", () => {
    cy.get(".search-bar").should("exist");
    cy.get(".search-input").should("have.attr", "placeholder");
  });

  it("shows the stats bar", () => {
    cy.get(".stats-bar").should("exist");
    cy.get(".stat-label").first().should("contain", "Total");
  });

  it("opens the new task form", () => {
    cy.get(".btn-primary").contains("New task").click();
    cy.get(".task-form-card").should("be.visible");
    cy.get(".task-form-card h2").should("contain", "New Task");
  });

  it("closes the new task form when clicking outside", () => {
    cy.get(".btn-primary").contains("New task").click();
    cy.get(".task-form-card").should("be.visible");
    cy.get(".form-overlay").click({ force: true });
    cy.get(".task-form-card").should("not.exist");
  });

  it("creates a new task", () => {
    const taskTitle = `Cypress test task ${Date.now()}`;
    cy.get(".btn-primary").contains("New task").click();
    cy.get('.task-form-card input[type="text"]').first().type(taskTitle);
    cy.get('.task-form-card button[type="submit"]').click();
    cy.get(".task-list").should("contain", taskTitle);
  });

  it("creates a task with high priority", () => {
    const taskTitle = `High priority task ${Date.now()}`;
    cy.get(".btn-primary").contains("New task").click();
    cy.get('.task-form-card input[type="text"]').first().type(taskTitle);
    cy.get(".priority-btn.priority-high").click();
    cy.get('.task-form-card button[type="submit"]').click();
    cy.get(".task-list").contains(taskTitle).closest(".task-item").find(".priority-tag.priority-high").should("exist");
  });

  it("marks a task as complete", () => {
    const taskTitle = `Complete me ${Date.now()}`;
    cy.get(".btn-primary").contains("New task").click();
    cy.get('.task-form-card input[type="text"]').first().type(taskTitle);
    cy.get('.task-form-card button[type="submit"]').click();
    cy.get(".task-list").contains(taskTitle).closest(".task-item").find(".task-check").click();
    cy.get(".task-list").contains(taskTitle).closest(".task-item").should("have.class", "completed");
  });

  it("deletes a task", () => {
    const taskTitle = `Delete me ${Date.now()}`;
    cy.get(".btn-primary").contains("New task").click();
    cy.get('.task-form-card input[type="text"]').first().type(taskTitle);
    cy.get('.task-form-card button[type="submit"]').click();
    cy.get(".task-list").contains(taskTitle).closest(".task-item").find(".task-delete").click();
    cy.get(".task-list").should("not.contain", taskTitle);
  });

  it("filters tasks by active", () => {
    cy.get(".sidebar-nav").contains("Active").click();
    cy.get(".main-header h1").should("contain", "Active");
    cy.get(".task-item.completed").should("not.exist");
  });

  it("filters tasks by completed", () => {
    cy.get(".sidebar-nav").contains("Completed").click();
    cy.get(".main-header h1").should("contain", "Completed");
  });

  it("searches for a task by title", () => {
    const taskTitle = `Searchable task ${Date.now()}`;
    cy.get(".btn-primary").contains("New task").click();
    cy.get('.task-form-card input[type="text"]').first().type(taskTitle);
    cy.get('.task-form-card button[type="submit"]').click();
    cy.get(".search-input").type(taskTitle.substring(0, 10));
    cy.get(".task-list").should("contain", taskTitle);
  });

  it("clears search with the clear button", () => {
    cy.get(".search-input").type("something");
    cy.get(".search-clear").should("be.visible").click();
    cy.get(".search-input").should("have.value", "");
  });

  it("logs out successfully", () => {
    cy.get(".logout-btn").click();
    cy.url().should("include", "/login");
  });
});
