import axios from "axios";
import * as jsdom from "jsdom";

export async function fetchAPIHTMLPage(): Promise<jsdom.JSDOM> {
  // We can not retrieve Persons from the REST API without being connected. However...
  // Patchwork's Django REST web portal exposes it in its HTML. This lets us retrieve the list without requiring a connection.
  // This page also contains projects so while we are at it, scrap these too
  const html = await axios.get("https://patchwork.kernel.org/api/patches/?msgid=0", {
    headers: { Accept: "text/html" },
  });

  return new jsdom.JSDOM(html.data);
}

export function getPersons(dom: jsdom.JSDOM): Record<string, string> {
  let persons: Record<string, string> = {};

  const personNodes = dom.window.document.querySelectorAll("#id_submitter > option");

  personNodes.forEach((personNode: Element) => {
    const valueAttribute = personNode.attributes.getNamedItem("value");
    if (valueAttribute) {
      const name = personNode.textContent ? personNode.textContent : "";
      persons[valueAttribute.value] = name;
    }
  });

  return persons;
}

export function getProjects(dom: jsdom.JSDOM): Record<string, string> {
  let projects: Record<string, string> = {};

  const projectNodes = dom.window.document.querySelectorAll("#id_project > option");

  projectNodes.forEach((projectNode: Element) => {
    const valueAttribute = projectNode.attributes.getNamedItem("value");
    if (valueAttribute) {
      const name = projectNode.textContent ? projectNode.textContent : "";
      projects[valueAttribute.value] = name;
    }
  });

  return projects;
}
