// privacy-accordion.js
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */

import {
    readBlockConfig,
  } from '../../scripts/aem.js';
  
  /**
   * Toggles the expansion state of a section.
   * @param {Element} titleRow The clickable title row element.
   * @param {Element} description The description element to toggle.
   */
  async function toggleSection(titleRow, description) {
    const isExpanded = titleRow.getAttribute('aria-expanded') === 'true';
    const arrow = titleRow.querySelector('.arrow');
  
    titleRow.setAttribute('aria-expanded', (!isExpanded).toString());
    description.setAttribute('aria-hidden', isExpanded.toString());
  
    if (!isExpanded) {
      // Expand: Set dynamic max-height for smooth animation
      description.style.maxHeight = `${description.scrollHeight}px`;
      arrow.setAttribute('aria-expanded', 'true');
    } else {
      // Collapse
      description.style.maxHeight = '0';
      arrow.setAttribute('aria-expanded', 'false');
    }
  }
  
  /**
   * Binds click events to all title rows for toggling.
   * @param {Element} block The accordion block element.
   */
  async function bindEvents(block) {
    const titleRows = block.querySelectorAll('.title-row');
    for (const titleRow of titleRows) {
      const descriptionId = titleRow.getAttribute('aria-controls');
      const description = block.querySelector(`#${descriptionId}`);
      if (description) {
        titleRow.addEventListener('click', () => {
          toggleSection(titleRow, description);
        });
  
        // Keyboard support
        titleRow.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleSection(titleRow, description);
          }
        });
      }
    }
  }
  
  /**
   * Builds a single section from config.
   * @param {string} title The section title.
   * @param {string} content The description HTML.
   * @returns {Element} The section element.
   */
  function buildSection(title, content) {
    const section = document.createElement('div');
    section.classList.add('section');
  
    const titleRow = document.createElement('div');
    titleRow.classList.add('title-row');
    titleRow.setAttribute('role', 'button');
    titleRow.setAttribute('tabindex', '0');
    titleRow.setAttribute('aria-expanded', 'false');
  
    const sectionTitle = document.createElement('h3');
    sectionTitle.classList.add('section-title');
    sectionTitle.textContent = title;
    titleRow.appendChild(sectionTitle);
  
    const arrow = document.createElement('span');
    arrow.classList.add('arrow');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '▼'; // Simple chevron; replace with SVG if needed
    titleRow.appendChild(arrow);
  
    const description = document.createElement('div');
    description.classList.add('description');
    description.id = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique ID
    description.setAttribute('aria-labelledby', titleRow.id || 'title-row');
    description.setAttribute('aria-hidden', 'true');
    description.innerHTML = content;
    titleRow.setAttribute('aria-controls', description.id);
  
    section.appendChild(titleRow);
    section.appendChild(description);
  
    return section;
  }
  
  /**
   * Decorates the block by parsing table rows into sections.
   * @param {Element} block The block element.
   */
  export default async function decorate(block) {
    const config = readBlockConfig(block);
    let mainTitle = '';
    const sections = [];
  
    // Parse rows
    block.querySelectorAll(':scope > div').forEach((row) => {
      const cols = [...row.children];
      if (cols.length >= 2) {
        const key = toClassName(cols[0].textContent.trim());
        const value = cols[1].innerHTML.trim() || cols[1].textContent.trim();
  
        if (key === 'main-title') {
          mainTitle = value;
        } else {
          sections.push({ title: key || value.split('\n')[0], content: value });
        }
      }
    });
  
    // Clear existing content
    block.innerHTML = '';
  
    // Add main title if present
    if (mainTitle) {
      const titleEl = document.createElement('h2');
      titleEl.classList.add('main-title');
      titleEl.textContent = mainTitle;
      block.appendChild(titleEl);
    }
  
    // Build and append sections
    sections.forEach(({ title, content }) => {
      const section = buildSection(title, content);
      block.appendChild(section);
    });
  
    // Bind interactions
    await bindEvents(block);
  }
  
  /**
   * Sanitizes a string for use as class name.
   * @param {string} name The unsanitized string.
   * @returns {string} The class name.
   */
  function toClassName(name) {
    return typeof name === 'string'
      ? name
          .toLowerCase()
          .replace(/[^0-9a-z]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : '';
  }