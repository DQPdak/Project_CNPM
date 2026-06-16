import "./CanvasTaskWorkspace.css";

function CanvasTaskWorkspace({ pages = [] }) {
  return (
    <section className="canvas-task-workspace">
      <div className="canvas-task-header">
        <div>
          <h2>Phan vung Canvas & Giao Task</h2>
          <p>
            Khu vuc nay dung de chon vung tren trang truyen va giao viec cho
            Assistant.
          </p>
        </div>

        <span className="canvas-task-badge">Canvas Task</span>
      </div>

      <div className="canvas-task-body">
        <div className="canvas-task-preview">
          <h3>Trang truyen</h3>

          {pages.length > 0 ? (
            <div className="canvas-task-page-list">
              {pages.map((page) => (
                <div key={page._id} className="canvas-task-page-item">
                  <span>Page {page.page_number}</span>
                  <span>{page.status || "Draft"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="canvas-task-empty">
              Chua co trang truyen de phan vung.
            </div>
          )}
        </div>

        <div className="canvas-task-panel">
          <h3>Thong tin task</h3>

          <label>
            Assistant
            <select disabled>
              <option>Chon Assistant</option>
            </select>
          </label>

          <label>
            Loai cong viec
            <input disabled placeholder="VD: Ve background, to mau..." />
          </label>

          <label>
            Mo ta
            <textarea disabled placeholder="Nhap yeu cau cong viec..." />
          </label>

          <button type="button" disabled>
            Giao task
          </button>
        </div>
      </div>
    </section>
  );
}

export default CanvasTaskWorkspace;