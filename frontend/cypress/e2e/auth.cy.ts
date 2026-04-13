/// <reference types="cypress" />

describe("Authentication", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects unauthenticated users to /login", () => {
    cy.visit("/");
    cy.url().should("include", "/login");
  });

  it("shows the login page with correct elements", () => {
    cy.visit("/login");
    cy.get(".logo").should("exist");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.get('button[type="submit"]').should("contain", "Sign in");
    cy.get("a").should("contain", "Create one");
  });

  it("shows an error for invalid credentials", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("wrong@email.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.get(".error-banner").should("be.visible");
    cy.get(".error-banner").should("not.be.empty");
  });

  it("navigates to register page from login", () => {
    cy.visit("/login");
    cy.get("a").contains("Create one").click();
    cy.url().should("include", "/register");
  });

  it("shows the register page with correct elements", () => {
    cy.visit("/register");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[placeholder="yourname"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.get('button[type="submit"]').should("contain", "Create account");
  });

  it("shows error when registering with existing email", () => {
    cy.fixture("user").then((user) => {
      cy.visit("/register");
      cy.get('input[type="email"]').type(user.email);
      cy.get('input[placeholder="yourname"]').type("differentusername");
      cy.get('input[type="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      cy.get(".error-banner").should("be.visible");
    });
  });

  it("navigates to login page from register", () => {
    cy.visit("/register");
    cy.get("a").contains("Sign in").click();
    cy.url().should("include", "/login");
  });
});
