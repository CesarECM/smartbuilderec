document.getElementById('sa-panel-plataforma').innerHTML = `
        <div class="sec-header">
          <h2>Mis planeaciones</h2>
          <a href="index?new=1" class="btn-primary" style="text-decoration:none">+ Nueva planeación</a>
        </div>
        <div id="sa-misCursos"><p class="loading-txt">Cargando...</p></div>

        <div class="sec-header sec-gap">
          <h2>Cursos por admin</h2>
          <button class="btn-sm" onclick="saCargarCursosPorAdmin()">↺ Actualizar</button>
        </div>
        <div id="sa-cursosPorAdmin"><p class="loading-txt">Cargando...</p></div>

        <div class="sec-header sec-gap">
          <h2>Wizard — instancias de todos los usuarios</h2>
          <button class="btn-sm" onclick="saCargarWizardInstanciasAdmin()">↺ Actualizar</button>
        </div>
        <div id="sa-wizardInstanciasAdmin"><p class="loading-txt">Cargando...</p></div>

        <div class="sec-header sec-gap">
          <h2>Historial de actividad</h2>
          <button class="btn-sm" onclick="saCargarAuditLog()">↺ Actualizar</button>
        </div>
        <div id="sa-auditContent"><p class="loading-txt">Cargando historial...</p></div>
`;
